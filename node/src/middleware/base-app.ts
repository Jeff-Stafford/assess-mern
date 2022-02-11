import { Request, Response, NextFunction } from 'express';
import HttpStatus from 'http-status-codes';
import { findUserByEmail } from '../services/user';

export const validatePayload = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const {
    account_name,
    account_number,
    account_logo,
    user_name_first,
    user_name_last,
    user_email,
    user_number
  } = req.body;
  const account = {
    name: account_name,
    logo: account_logo,
    number: account_number
  };
  const user = {
    name_first: user_name_first,
    name_last: user_name_last,
    email: user_email,
    number: user_number
  };
  if (!_areAccountAndUserValid(account, user)) {
    res.status(HttpStatus.UNPROCESSABLE_ENTITY).json({
      message: 'Account and user are not valid. Check missing fields.'
    });
    return;
  }

  const existingUser = await findUserByEmail(user.email);
  if (existingUser) {
    res
      .status(HttpStatus.CONFLICT)
      .json({ message: 'User with this email already exists.' });
    return;
  }

  req.body = { account, user };

  next();
};

const _areAccountAndUserValid = (account: any, user: any): boolean =>
  !_hasMissingValues(account, ['name', 'logo', 'number']) &&
  !_hasMissingValues(user, ['name_first', 'name_last', 'number', 'email']);

const _hasMissingValues = (object: any, requiredFields: string[]): boolean => {
  if (!object) {
    return true;
  }
  for (const key of requiredFields) {
    if (!object[key]) {
      return true;
    }
  }
  return false;
};
