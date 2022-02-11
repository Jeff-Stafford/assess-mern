import { Request, Response } from 'express';
import HttpStatus from 'http-status-codes';
import * as customerService from '../services/customer';
import {
  subscribeToCustomer,
  hasUserRelationToCustomer
} from '../services/user';
import { generateMySqlNOWFunction } from '../utils';
import { getLogger } from '../helpers/logger';
import trackActivity from '../helpers/activity-tracker';
import { DPActivityType, NoteType } from '../types';
import { findXConnects } from '../services/customer';

const LOG = getLogger('customer-controller');

export const createNote = async (req: Request, res: Response) => {
  const { customerId } = req.params;
  const { comment = '' } = req.body;
  const {
    accountId,
    id: requestUserId,
    nameFirst: requestUserFirstName
  } = req.tokenPayload;
  try {
    const note = await customerService.createCustomerNote(
      +customerId,
      requestUserId,
      comment,
      NoteType.NOTE
    );

    trackActivity(
      DPActivityType.NOTE_INSERTED,
      `Note ${note.id} inserted with the comment: ${comment.substring(
        0,
        10
      )}...`,
      requestUserId
    );

    res
      .status(HttpStatus.CREATED)
      .json({ ...note.dataValues, note_datetime: null });

    await customerService.updateCustomerByIdAndAccountId(
      +customerId,
      accountId,
      {
        last_update: generateMySqlNOWFunction(),
        last_update_action: `${requestUserFirstName}: ${comment}`
      }
    );
    customerService.updateReadStatusForSubscribedUsers(
      requestUserId,
      +customerId
    );
  } catch (error) {
    LOG.error(
      'Create a note for customer [%d] and user [%d]: %s',
      customerId,
      requestUserId,
      error.message
    );
    res
      .status(HttpStatus.BAD_REQUEST)
      .json({ message: 'Unable to create a note. Please try again later.' });
  }
};

export const checkDoesCustomerExist = async (
  req: Request & { query: { phone: string } },
  res: Response
) => {
  const { accountId } = req.tokenPayload;
  const { phone } = req.query;

  try {
    const dpCustomer = await customerService.findCustomerByPhoneNumber(
      phone,
      +accountId
    );

    if (!dpCustomer) {
      return res
        .status(HttpStatus.NOT_FOUND)
        .json({ message: `Customer with phone number ${phone} not found.` });
    }

    res.json(dpCustomer);
  } catch (error) {
    LOG.error(
      'Find customer with phone number [%s] for account [%d]: %s',
      phone,
      accountId,
      error.message
    );
    res
      .status(HttpStatus.BAD_REQUEST)
      .json({ message: 'Could not find customer. Try again later.' });
  }
};

export const createCustomer = async (
  { tokenPayload, body }: Request,
  res: Response
) => {
  const { phone_number: phoneNumber, full_name: fullName } = body;
  try {
    const createdCustomer = await customerService.createCustomer({
      customer_number: phoneNumber,
      customer_name: fullName,
      frn_dpaccountid: tokenPayload.accountId,
      last_update: generateMySqlNOWFunction(),
      last_update_action: `${tokenPayload.nameFirst}: Customer created.`
    });

    await subscribeToCustomer(tokenPayload.id, createdCustomer.id);

    res.status(HttpStatus.CREATED).json({
      message: 'Customer created successfully.',
      customer_id: createdCustomer.id
    });
  } catch (error) {
    LOG.error('Create customer: %s', error.message);
    res.status(HttpStatus.BAD_REQUEST).json({
      message: 'Unable to create a customer. Please try again later.'
    });
  }
};

export const updateCustomer = async (req: Request, res: Response) => {
  const { customerId } = req.params;
  const { full_name: fullName } = req.body;
  const {
    accountId,
    id: requestUserId,
    nameFirst: requestUserFirstName
  } = req.tokenPayload;
  try {
    await customerService.updateCustomerByIdAndAccountId(
      +customerId,
      accountId,
      {
        customer_name: fullName,
        last_update: generateMySqlNOWFunction(),
        last_update_action: `${requestUserFirstName}: Customer name updated.`
      }
    );

    const isUserAlreadySubscribedToCustomer = await hasUserRelationToCustomer(
      requestUserId,
      +customerId
    );

    if (!isUserAlreadySubscribedToCustomer) {
      await subscribeToCustomer(requestUserId, +customerId);
    }

    trackActivity(
      DPActivityType.CUSTOMER_DATA_UPDATED,
      `Customer ${customerId} changed full name to ${fullName}`,
      requestUserId
    );

    res.json({
      message: 'Customer updated successfully.',
      customer_id: +customerId
    });
  } catch (error) {
    LOG.error('Update customer [%d]: %s', customerId, error.message);
    res.status(HttpStatus.BAD_REQUEST).json({
      message: 'Unable to update a customer. Please try again later.'
    });
  }
};

export const getXConnects = async (
  req: Request,
  res: Response
): Promise<void> => {
  const xConnects = await findXConnects(+req.params.customerId);
  res.json(xConnects);
};
