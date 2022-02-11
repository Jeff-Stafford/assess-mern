import { Request, Response } from 'express';
import HttpStatus from 'http-status-codes';
import * as phoneNumberService from '../services/phone-number';
import { getAvailableNumbersByAreaCode } from '../services/phone-number';
import { provisionNumber } from '../helpers/twilio';
import { getLogger } from '../helpers/logger';
import trackActivity from '../helpers/activity-tracker';
import { DPActivityType } from '../types';

const LOG = getLogger('phone-number-controller');

export const getPhoneNumbers = async (
  { tokenPayload: { accountId } }: Request,
  res: Response
) => {
  const phoneNumbers = await phoneNumberService.findPhoneNumbersByAccountId(
    accountId
  );

  res.json(phoneNumbers);
};

export const getPhoneNumberTypes = async (_: Request, res: Response) => {
  const phoneNumberTypes = await phoneNumberService.findPhoneNumberTypes();
  res.json(phoneNumberTypes);
};

export const createPhoneNumber = async (
  { tokenPayload, body }: Request,
  res: Response
) => {
  const { number_label, number_did, number_type } = body;
  const { accountId, id: requestUserId } = tokenPayload;
  try {
    const phoneNumberId = await provisionNumber(
      number_did,
      number_label,
      accountId,
      number_type
    );
    trackActivity(
      DPActivityType.NEW_NUMBER_PROVISIONED,
      'New number provisioned while creating a new number',
      requestUserId
    );
    res.status(HttpStatus.CREATED).json({ phoneNumberId });
  } catch (error) {
    LOG.error('Create phone number: %s', error.message);
    if (error.message === 'twilio-error') {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json({ message: 'Could not provision number on Twilio.' });
    }
    res
      .status(HttpStatus.BAD_REQUEST)
      .json({ message: 'Something is wrong. Try again later.' });
  }
};

export const checkNumbersAvailability = async (
  req: Request & { query: { areaCode: string } },
  res: Response
) => {
  const { areaCode } = req.query;
  try {
    const availablePhoneNumbers = await getAvailableNumbersByAreaCode(areaCode);
    res.json(availablePhoneNumbers);
  } catch (error) {
    if (error.message === 'twilio-error') {
      return res
        .status(HttpStatus.NOT_FOUND)
        .json({ message: 'Could not get available numbers from Twilio.' });
    }
    res
      .status(HttpStatus.BAD_REQUEST)
      .json({ message: 'Something is wrong. Try again later.' });
  }
};

export const getPhoneNumber = async (
  { tokenPayload: { accountId }, params }: Request,
  res: Response
) => {
  const { id: phoneNumberId } = params;
  const phoneNumber = await phoneNumberService.findPhoneNumberByAccountIdPhoneNumberId(
    accountId,
    +phoneNumberId
  );
  if (!phoneNumber) {
    return res.status(HttpStatus.NOT_FOUND).end();
  }

  res.json(phoneNumber);
};

export const updatePhoneNumber = async (
  { tokenPayload: { accountId }, body, params }: Request,
  res: Response
) => {
  const { number_label, forward_huntid, fallback_huntid } = body;
  const { id: phoneNumberId } = params;
  try {
    await phoneNumberService.updatePhoneNumber(+phoneNumberId, accountId, {
      number_label,
      forward_huntid,
      fallback_huntid
    });

    res.json({ message: 'Phone number updated.' });
  } catch (err) {
    LOG.error('Update phone number [%d]: %s', phoneNumberId, err.message);
    res.status(HttpStatus.BAD_REQUEST).json({ message: err.message });
  }
};

export const deletePhoneNumber = async (
  { tokenPayload: { accountId }, params }: Request,
  res: Response
) => {
  const { id: phoneNumberId } = params;

  await phoneNumberService.deactivatePhoneNumber(+phoneNumberId, accountId);

  res.json({ message: 'Phone number deleted.' });
};
