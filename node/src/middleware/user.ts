import { Request, Response, NextFunction } from 'express';
import HttpStatus from 'http-status-codes';
import { DEFAULT_HUNT_GREETING_ID } from '../config/constants';
import { getLogger } from '../helpers/logger';
import {
  findVoicemailGreetingByUserIdAndGreetingId,
  getActiveUserByPhoneNumberAndEmail
} from '../services/user';
import { getCustomerRowCount } from '../services/customer';

const LOG = getLogger('user-middleware');

export const isReadyToCreate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  const { email, number_did } = req.body;
  if (!email || !number_did) {
    return res
      .status(HttpStatus.BAD_REQUEST)
      .json({ message: 'Email and number are required for user creation.' });
  }
  try {
    const existingUser = await getActiveUserByPhoneNumberAndEmail(
      number_did,
      email
    );
    if (existingUser) {
      return res.status(HttpStatus.CONFLICT).json({
        message:
          'User with email or number already exists in the system. Use another'
      });
    }
    next();
  } catch (error) {
    LOG.error(
      'Validate user email [%s] and phone number [%s] before creation: %s',
      email,
      number_did,
      error.message
    );
    res
      .status(HttpStatus.BAD_REQUEST)
      .json('Could not validate user before creation. Try again later');
  }
};

export const checkForUserOwnThread = (
  { tokenPayload: { userAsCustomerId }, params: { customerId } }: Request,
  res: Response,
  next: NextFunction
) => {
  if (!userAsCustomerId || +customerId === userAsCustomerId) {
    return res.status(HttpStatus.FORBIDDEN).end();
  }
  next();
};

export const prepareThreadNotesPagination = (
  req: Request,
  _: Response,
  next: NextFunction
) => {
  const { page, limit } = req.query;
  if (page && limit) {
    try {
      req.pagination = {
        page: +page,
        limit: +limit
      };
    } catch (error) {
      LOG.warn(
        'Unable to prepare pagination for page %s and limit %s: %s',
        page,
        limit,
        error.message
      );
    }
  }
  next();
};

export const checkForGreetingTenancy = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { userId } = req.params;
  const { tokenPayload } = req;
  const { greeting_id } = req.body;

  if (greeting_id === DEFAULT_HUNT_GREETING_ID) {
    return next();
  }

  const userGreeting = await findVoicemailGreetingByUserIdAndGreetingId(
    +userId,
    greeting_id,
    +tokenPayload.accountId
  );
  if (!userGreeting) {
    return res.status(HttpStatus.FORBIDDEN).end();
  }
  next();
};

export const checkIfCustomerBelongsToDPAccount = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { customerId } = req.params;
  const { accountId } = req.tokenPayload;

  const rows = await getCustomerRowCount(+customerId, +accountId);

  if (!rows) {
    return res.status(HttpStatus.FORBIDDEN).end();
  }

  next();
};
