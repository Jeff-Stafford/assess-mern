import { Request, Response } from 'express';
import HttpStatus from 'http-status-codes';
import {
  findUserByEmail,
  getUserById,
  updateVerificationCodeByEmail,
  findByDPNumber,
  findUserIdsByCellPhone,
  updateVerificationCodeByIds,
  getUsersByEmail,
  getUsersByIds,
  getUsersByDPNumber,
  updateVerificationCodeByDPNumber
} from '../services/user';
import { setRingActive, findUserRingByPhoneNumber } from '../services/ring';
import * as emailHelper from '../helpers/email';
import { getLogger } from '../helpers/logger';
import { createEmailRecipient, generateVerificationCode } from '../utils';
import * as twilioHelper from '../helpers/twilio';
import { renderLoginEmail } from '../helpers/email-template-renderer';
import trackActivity from '../helpers/activity-tracker';
import { DPActivityType } from '../types';
import { generateToken } from '../security';

const LOG = getLogger('auth-controller');

export const login = async (req: Request, res: Response) => {
  const { email } = req.body;
  try {
    const dpUser = await findUserByEmail(email);
    if (!dpUser) {
      return res.status(HttpStatus.NOT_FOUND).json({ message: 'Wrong email' });
    }

    const verificationCode = generateVerificationCode();

    await dpUser.update({
      verificationCode,
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
      renderLoginEmail(req.header('origin'), verificationCode, email)
    );

    res.json({ message: 'Login Verification email sent.' });
  } catch (error) {
    LOG.error('Get user by email [%s]: %s', email, error.message);

    res
      .status(HttpStatus.BAD_REQUEST)
      .json({ message: 'Can not find user. Please try again.' });
  }
};

export const loginMobile = async (req: Request, res: Response) => {
  const { phone_number } = req.body;
  try {
    const ringDpUser = await findUserRingByPhoneNumber(phone_number);
    if (!ringDpUser?.user) {
      return res
        .status(HttpStatus.NOT_FOUND)
        .json({ message: 'Wrong phone number' });
    }

    const verificationCode = generateVerificationCode();
    const dpUser = ringDpUser.user;

    await dpUser.update({
      verificationCode,
      verificationCodeCreatedAt: Date.now()
    });

    await twilioHelper.sendVerificationRequest({
      phone_number,
      confirm_code: `${verificationCode}`
    });

    res.json({ message: 'Login Verification SMS sent.' });
  } catch (error) {
    if (error.message === 'twilio-error') {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: 'Could not send the verification SMS. Please try again.'
      });
    }
    LOG.error('Get user by phone number [%s]: %s', phone_number, error.message);
    res
      .status(HttpStatus.BAD_REQUEST)
      .json({ message: 'Can not find user. Please try again.' });
  }
};

export const verifyLogin = async (req: Request, res: Response) => {
  const { token, user: dpUser } = req.body;

  await dpUser.update({
    verificationCode: null,
    verificationCodeCreatedAt: null
  });

  const userId = dpUser.id;
  const user = await getUserById(userId);

  setRingActive(userId);

  trackActivity(DPActivityType.LOGGED_IN, 'User logged in', userId);

  res.json({ token, user });
};

const _generateAndSendVerificationCodeToEmail = async (
  firstName: String,
  lastName: String,
  requestOrigin: string | undefined,
  email: string,
  phoneNumber?: string
): Promise<void> => {
  // The ejwakefield@gmail.com is email used by Apple
  // to review our app. In this case, we are hardcoding
  // the verification code.
  const verificationCode =
    email === 'ejwakefield@gmail.com' ? 121212 : generateVerificationCode();
  const verificationPayload = {
    verificationCode,
    verificationCodeCreatedAt: Date.now()
  };
  if (phoneNumber) {
    await updateVerificationCodeByDPNumber(phoneNumber, verificationPayload);
  } else {
    await updateVerificationCodeByEmail(email, verificationPayload);
  }

  await emailHelper.sendEmail(
    [createEmailRecipient(email, `${firstName} ${lastName}`)],
    'Tone login request',
    renderLoginEmail(requestOrigin, verificationCode, email, phoneNumber)
  );
};

export const loginV2 = async (req: Request, res: Response) => {
  const { email, phone_number } = req.body;
  try {
    if (email) {
      const user = await findUserByEmail(email);
      if (!user) {
        return res
          .status(HttpStatus.NOT_FOUND)
          .json({ message: 'Wrong email' });
      }
      await _generateAndSendVerificationCodeToEmail(
        user.name_first,
        user.name_last,
        req.header('origin'),
        email,
        phone_number
      );
      return res.json({ message: 'Login Verification email sent.' });
    }
    if (phone_number) {
      const user = await findByDPNumber(phone_number);
      if (user) {
        await _generateAndSendVerificationCodeToEmail(
          user.name_first,
          user.name_last,
          req.header('origin'),
          user.email,
          phone_number
        );
        return res.json({ message: 'Login Verification email sent.' });
      }
      const userIdsByCellPhone = await findUserIdsByCellPhone(phone_number);
      const verificationCode = generateVerificationCode();
      await updateVerificationCodeByIds(userIdsByCellPhone, {
        verificationCode,
        verificationCodeCreatedAt: Date.now()
      });
      await twilioHelper.sendVerificationRequest({
        phone_number,
        confirm_code: `${verificationCode}`
      });

      return res.json({ message: 'Login Verification SMS sent.' });
    }
    res.status(HttpStatus.BAD_REQUEST).json({
      message: 'Please provide email or phone number to be able to login.'
    });
  } catch (error) {
    LOG.error(
      'Unable to login with email %s or phone number %s: %s',
      email,
      phone_number,
      error.message
    );
    res
      .status(HttpStatus.BAD_REQUEST)
      .json({ message: 'Could not send login verification code.' });
  }
};

export const verifyLoginV2 = async (req: Request, res: Response) => {
  const { email, dpNumber, userIds } = req.body;
  let users;
  if (email) {
    users = await getUsersByEmail(email);
  } else if (dpNumber) {
    users = await getUsersByDPNumber(dpNumber);
  } else {
    users = await getUsersByIds(userIds);
  }

  //@ts-ignore
  const usersAndTokens = users.map(({ dataValues }) => {
    const {
      id,
      account,
      email,
      number,
      name_first: nameFirst,
      name_last: nameLast,
      frn_dpcustomerid: userAsCustomerId
    } = dataValues;
    return {
      user: dataValues,
      token: generateToken({
        id,
        accountId: account.id,
        numberId: number.id,
        email,
        nameFirst,
        nameLast,
        userAsCustomerId
      })
    };
  });

  return res.json(usersAndTokens);
};
