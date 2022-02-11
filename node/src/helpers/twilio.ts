import twilioClient from '../api/twillio';
import { getLogger } from './logger';
import { MobileLoginVerificationRequest, PhoneNumberType } from '../types';

const LOG = getLogger('twilio-helper');

const getTwilioError = () => new Error('twilio-error');

export const sendVerificationRequest = async (
  payload: MobileLoginVerificationRequest
) => {
  try {
    const { data } = await twilioClient.post('/sms/sendverifycode', payload);
    return data;
  } catch (error) {
    LOG.error(
      'Send mobile login verification request to TWILIO: %s',
      error.message
    );
    throw getTwilioError();
  }
};

export const checkAvailableNumbersForAreaCode = async (
  areaCode: string
): Promise<string[]> => {
  try {
    const { data } = await twilioClient.get('/phone_numbers/check', {
      params: { areaCode }
    });
    if (!data.success) {
      return [];
    }
    return data.data.available_numbers.map((an: any) => an.phoneNumber);
  } catch (error) {
    LOG.error(
      'Fetch available numbers from TWILIO for given area code [%s]: %s',
      areaCode,
      error.message
    );
    throw getTwilioError();
  }
};

export const provisionNumber = async (
  numberDid: string,
  numberLabel: string,
  accountId: number,
  numberType: PhoneNumberType
): Promise<number> => {
  try {
    const { data } = await twilioClient.post('/phone_numbers/provision', {
      did: numberDid,
      label: numberLabel,
      account_id: accountId,
      number_type: numberType
    });
    if (!data.success) {
      throw getTwilioError();
    }
    return data.data.dpnumber_id;
  } catch (error) {
    LOG.error('Provision number [%s] on TWILIO: %s', numberDid, error.message);
    throw getTwilioError();
  }
};
