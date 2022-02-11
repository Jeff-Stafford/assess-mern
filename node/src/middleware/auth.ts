import { Request, Response, NextFunction } from 'express';
import HttpStatus from 'http-status-codes';
import {
  findUserByEmailAndVerificationCode,
  hasUserPrimaryOrSpecificPermissions,
  updateVerificationCodeByEmail,
  findByDPNumberAndVerificationCode,
  findUsersByCellPhoneAndVerificationCode,
  updateVerificationCodeByIds
} from '../services/user';
import { getUserRingByPhoneNumberAndVerificationCode } from '../services/ring';
import {
  LOGIN_VERIFICATION_CODE_AGE_IN_MILLISECONDS,
  X_BASE_CUSTOM_HEADER
} from '../config/constants';
import { generateToken, verifyToken } from '../security';
import { createEmailRecipient, generateVerificationCode } from '../utils';
import * as emailHelper from '../helpers/email';
import * as twilioHelper from '../helpers/twilio';
import { getLogger } from '../helpers/logger';
import { SocketAuth, ToneSocket, UserPermission } from '../types';
import { renderLoginEmail } from '../helpers/email-template-renderer';

const LOG = getLogger('auth-middleware');

const _hasLoginVerificationCodeExpired = (codeCreatedAt: Date) =>
  Date.now() - codeCreatedAt.getTime() >
  LOGIN_VERIFICATION_CODE_AGE_IN_MILLISECONDS;

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authorizationHeader = req.header('Authorization');

  if (!authorizationHeader) {
    return res
      .status(HttpStatus.UNAUTHORIZED)
      .json({ message: 'No authorization provided.' });
  }

  try {
    const token = authorizationHeader.replace('Bearer ', '');
    const tokenPayload = verifyToken(token);
    req.tokenPayload = tokenPayload;

    const IP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    LOG.info('user [%d] from IP_ADDRESS [%s]', tokenPayload.id, IP);

    next();
  } catch (error) {
    LOG.error('Authorization flow: %s', error.message);
    res
      .status(HttpStatus.UNAUTHORIZED)
      .json({ message: 'Wrong authorization token sent. Please login.' });
  }
};

export const authenticateSocketConnection = (
  socket: ToneSocket,
  next: NextFunction
): void => {
  const auth: SocketAuth = socket.handshake.auth;
  if (!auth.token) {
    return next(new Error('No token provided for socket connection.'));
  }
  try {
    const { accountId, id } = verifyToken(auth.token);
    socket.accountId = accountId;
    socket.userId = id;
    socket.join(`ACCOUNT:${accountId}`);
    next();
  } catch (err) {
    next(new Error('Unauthorized.'));
  }
};

export const checkVerificationCode = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { email: verificationEmail, verificationCode } = req.body;
  try {
    const dpUser = await findUserByEmailAndVerificationCode(
      verificationEmail,
      verificationCode
    );

    if (!dpUser) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json({ message: 'You submitted wrong verification code.' });
    }

    if (_hasLoginVerificationCodeExpired(dpUser.verificationCodeCreatedAt)) {
      const code = generateVerificationCode();
      dpUser.update({
        verificationCode: code,
        verificationCodeCreatedAt: Date.now()
      });

      await emailHelper.sendEmail(
        [
          createEmailRecipient(
            dpUser.email,
            `${dpUser.name_first} ${dpUser.name_last}`
          )
        ],
        'Tone login request',
        renderLoginEmail(req.header('origin'), code, verificationEmail)
      );

      return res.status(HttpStatus.BAD_REQUEST).json({
        message: 'Verification code has expired. New code sent via email.'
      });
    }

    const {
      id,
      frn_dpaccountid: accountId,
      email,
      frn_dpnumberid: numberId,
      name_first: nameFirst,
      name_last: nameLast,
      frn_dpcustomerid: userAsCustomerId
    } = dpUser;

    const token = generateToken({
      id,
      accountId,
      numberId,
      email,
      nameFirst,
      nameLast,
      userAsCustomerId
    });

    req.body = { token, user: dpUser };

    next();
  } catch (error) {
    LOG.error('Verify user by email and verification code: %s', error.message);
    res
      .status(HttpStatus.BAD_REQUEST)
      .json({ message: 'Wrong email or verification code.' });
  }
};

export const checkMobileVerificationCode = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const {
    phone_number: verificationPhoneNumber,
    verification_code: verificationCode
  } = req.body;
  if (!verificationPhoneNumber || !verificationCode) {
    return res
      .status(HttpStatus.BAD_REQUEST)
      .json({ message: 'Phone or verification code is missing.' });
  }
  try {
    const ringDpUser = await getUserRingByPhoneNumberAndVerificationCode(
      verificationPhoneNumber,
      verificationCode
    );

    if (!ringDpUser?.user) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json({ message: 'You submitted wrong verification code.' });
    }

    const dpUser = ringDpUser.user;

    if (_hasLoginVerificationCodeExpired(dpUser.verificationCodeCreatedAt)) {
      const code = generateVerificationCode();
      dpUser.update({
        verificationCode: code,
        verificationCodeCreatedAt: Date.now()
      });

      await twilioHelper.sendVerificationRequest({
        phone_number: verificationPhoneNumber,
        confirm_code: `{verificationCode}`
      });

      return res.status(HttpStatus.BAD_REQUEST).json({
        message: 'Verification code has expired. New code sent via SMS.'
      });
    }

    const {
      id,
      frn_dpaccountid: accountId,
      email,
      frn_dpnumberid: numberId,
      name_first: nameFirst,
      name_last: nameLast,
      frn_dpcustomerid: userAsCustomerId
    } = dpUser;

    const token = generateToken({
      id,
      accountId,
      numberId,
      email,
      nameFirst,
      nameLast,
      userAsCustomerId
    });

    req.body = { token, user: dpUser };

    next();
  } catch (error) {
    LOG.error(
      'Verify user by phone number and verification code: %s',
      error.message
    );
    res
      .status(HttpStatus.BAD_REQUEST)
      .json({ message: 'Wrong phone number or verification code.' });
  }
};

export const checkVerificationCodeV2 = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const {
    email: verificationEmail,
    verification_code: verificationCode,
    phone_number: verificationPhoneNumber,
    isMobile
  } = req.body;

  if (verificationEmail) {
    const dpUser = await findUserByEmailAndVerificationCode(
      verificationEmail,
      verificationCode
    );

    if (!dpUser) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json({ message: 'You submitted wrong verification code.' });
    }
    if (_hasLoginVerificationCodeExpired(dpUser.verificationCodeCreatedAt)) {
      const code = generateVerificationCode();
      await updateVerificationCodeByEmail(verificationEmail, {
        verificationCode: code,
        verificationCodeCreatedAt: Date.now()
      });

      await emailHelper.sendEmail(
        [
          createEmailRecipient(
            dpUser.email,
            `${dpUser.name_first} ${dpUser.name_last}`
          )
        ],
        'Tone login request',
        renderLoginEmail(req.header('origin'), code, verificationEmail)
      );

      return res.status(HttpStatus.BAD_REQUEST).json({
        message: 'Verification code has expired. New code sent via email.'
      });
    }

    await updateVerificationCodeByEmail(verificationEmail, {
      verificationCode: null,
      verificationCodeCreatedAt: null
    });

    return next();
  }

  if (verificationPhoneNumber) {
    const user = await findByDPNumberAndVerificationCode(
      verificationPhoneNumber,
      verificationCode
    );
    if (user) {
      if (_hasLoginVerificationCodeExpired(user.verificationCodeCreatedAt)) {
        const code = generateVerificationCode();
        await user.update({
          verificationCode: code,
          verificationCodeCreatedAt: Date.now()
        });
        await emailHelper.sendEmail(
          [
            createEmailRecipient(
              user.email,
              `${user.name_first} ${user.name_last}`
            )
          ],
          'Tone login request',
          renderLoginEmail(
            req.header('origin'),
            code,
            verificationEmail,
            verificationPhoneNumber
          )
        );

        return res.status(HttpStatus.BAD_REQUEST).json({
          message: 'Verification code has expired. New code sent via email.'
        });
      }
      await user.update({
        verificationCode: null,
        verificationCodeCreatedAt: null
      });

      req.body.dpNumber = verificationPhoneNumber;

      return next();
    }

    const users = await findUsersByCellPhoneAndVerificationCode(
      verificationPhoneNumber,
      verificationCode
    );
    if (!users.length) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json({ message: 'You submitted wrong verification code.' });
    }
    const userIds = users.map(({ id }) => id);
    if (_hasLoginVerificationCodeExpired(users[0].verificationCodeCreatedAt)) {
      const code = generateVerificationCode();
      await updateVerificationCodeByIds(userIds, {
        verificationCode: code,
        verificationCodeCreatedAt: Date.now()
      });

      await twilioHelper.sendVerificationRequest({
        phone_number: verificationPhoneNumber,
        confirm_code: `${code}`
      });

      return res
        .status(HttpStatus.BAD_REQUEST)
        .json({ message: 'Login Verification SMS sent.' });
    }

    await updateVerificationCodeByIds(userIds, {
      verificationCode: null,
      verificationCodeCreatedAt: null
    });

    req.body.userIds = userIds;

    return next();
  }
  res.status(HttpStatus.BAD_REQUEST).json({
    message:
      'Please provide valid email or phone number along with verification code'
  });
};

export const authorizeUser = (
  { tokenPayload: { id: requestUserId }, params: { userId } }: Request,
  res: Response,
  next: NextFunction
) => {
  if (+userId !== requestUserId) {
    return res
      .status(HttpStatus.FORBIDDEN)
      .json({ message: 'You are not authorized to do that.' });
  }

  next();
};

const _hasUserPermission = async (
  { tokenPayload: { id: userId } }: Request,
  res: Response,
  next: NextFunction,
  permission: UserPermission
) => {
  const hasPermission = await hasUserPrimaryOrSpecificPermissions(
    userId,
    permission
  );

  if (!hasPermission) {
    return res
      .status(HttpStatus.FORBIDDEN)
      .json({ message: 'You have no permission.' });
  }

  next();
};

export const hasAccountPrimaryUserPermission = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  await _hasUserPermission(req, res, next, UserPermission.ACCOUNT_PRIMARY_USER);
};

export const hasPrimaryBillingPermission = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  await _hasUserPermission(
    req,
    res,
    next,
    UserPermission.ACCOUNT_PRIMARY_BILLING
  );
};

export const hasConfigureNumbersPermission = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  await _hasUserPermission(req, res, next, UserPermission.CONFIGURE_NUMBERS);
};

export const hasConfigureUsersPermission = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  await _hasUserPermission(req, res, next, UserPermission.CONFIGURE_USERS);
};

export const hasCallBargePermission = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  await _hasUserPermission(req, res, next, UserPermission.CALL_BARGE);
};

export const hasConfigureUsersOrGeneralVoicemailPermission = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const hasConfigureUsersPermission = await hasUserPrimaryOrSpecificPermissions(
    req.tokenPayload.id,
    UserPermission.CONFIGURE_USERS
  );

  const hasConfigureGeneralVoicemailPermission = await hasUserPrimaryOrSpecificPermissions(
    req.tokenPayload.id,
    UserPermission.GENERAL_VOICEMAIL_MANAGER
  );

  if (!hasConfigureUsersPermission && !hasConfigureGeneralVoicemailPermission) {
    return res
      .status(HttpStatus.FORBIDDEN)
      .json({ message: 'You have no permission.' });
  }

  next();
};

export const authenticateBaseApp = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const baseApiToken = req.header('X-Base-Api-Token');
  if (!areBaseHeadersValid(baseApiToken)) {
    return res.status(HttpStatus.UNAUTHORIZED).end();
  }
  next();
};

const areBaseHeadersValid = (token: string | undefined): boolean =>
  token === X_BASE_CUSTOM_HEADER;
