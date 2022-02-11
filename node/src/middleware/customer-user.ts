import { Request, Response, NextFunction } from 'express';
import HttpStatus from 'http-status-codes';
import { findCustomerIdByCallId } from '../services/call';
import { findCustomerByIdAndAccountId } from '../services/customer';
import {
  findUserFollowIds,
  hasAnyUserSubscriptionToCustomer,
  hasUserRelationToCustomer,
  subscribeToCustomer
} from '../services/user';

export const checkUserAndCustomerRelation = async (
  { tokenPayload: { id: userId }, params: { customerId } }: Request,
  res: Response,
  next: NextFunction
) => {
  const customerUserRelation = await hasUserRelationToCustomer(
    userId,
    +customerId
  );

  if (customerUserRelation) {
    return next();
  }

  try {
    await validateUserAndCustomerRelation(userId, +customerId);

    await subscribeToCustomer(userId, +customerId);

    next();
  } catch (error) {
    res.status(HttpStatus.FORBIDDEN).json({ message: error.message });
  }
};

export const customerBelongsToSameAccountThroughCall = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { tokenPayload } = req;
    const { id: callId } = req.params;
    const customerId = await findCustomerIdByCallId(+callId);
    const customerInDPAccount = await findCustomerByIdAndAccountId(
      +customerId,
      tokenPayload.accountId
    );
    if (!customerInDPAccount) {
      return res.status(HttpStatus.FORBIDDEN).json({
        message: 'You are not allowed to access that customer.'
      });
    }
    next();
  } catch (error) {
    let statusCode = HttpStatus.FORBIDDEN;
    if (error.message === 'Call not found') {
      statusCode = HttpStatus.NOT_FOUND;
    }
    res.status(statusCode).json({ message: error.message });
  }
};

export const checkUserAndCustomerRelationThroughCall = async (
  { tokenPayload: { id: userId }, params: { id: callId } }: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const customerId = await findCustomerIdByCallId(+callId);
    const customerUserRelation = await hasUserRelationToCustomer(
      userId,
      customerId
    );

    if (customerUserRelation) {
      return next();
    }

    await validateUserAndCustomerRelation(userId, customerId);

    next();
  } catch (error) {
    let statusCode = HttpStatus.FORBIDDEN;
    if (error.message === 'Call not found') {
      statusCode = HttpStatus.NOT_FOUND;
    }
    res.status(statusCode).json({ message: error.message });
  }
};

const validateUserAndCustomerRelation = async (
  userId: number,
  customerId: number
): Promise<void> => {
  const followingUserIds = await findUserFollowIds(userId);
  if (!followingUserIds.length) {
    throw new Error(
      'You need to have at least one following user subscribed to that customer.'
    );
  }

  const isAnyFollowingUserSubscribedToCustomer = await hasAnyUserSubscriptionToCustomer(
    customerId,
    followingUserIds
  );
  if (!isAnyFollowingUserSubscribedToCustomer) {
    throw new Error(
      'No one of your following users have a subscription to that customer.'
    );
  }
};

export const isUserAlreadySubscribedToCustomer = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { userId, customerId } = req.params;

  const customerUserRelation = await hasUserRelationToCustomer(
    +userId,
    +customerId
  );

  if (customerUserRelation) {
    return res.json({
      customer_id: customerId,
      message: `You have already subscribed to customer [${customerId}].`
    });
  }

  next();
};
