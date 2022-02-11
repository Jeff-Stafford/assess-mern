import { Request, Response, NextFunction } from 'express';
import HttpStatus from 'http-status-codes';
import { getLogger } from '../helpers/logger';
import { formatPhoneNumber } from '../utils';
import { findCustomerByPhoneNumber } from '../services/customer';
import { findXlabelDPCustomerByJobId } from '../services/xlabel';

const LOG = getLogger('browser-extension-middleware');

export const prepareAccuLynxJobsData = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      contact: { phone, uniqueID }
    } = req.body;
    const formattedPhone = formatPhoneNumber(phone);
    const existingCustomer = await findCustomerByPhoneNumber(
      formattedPhone,
      req.tokenPayload.accountId
    );
    const existingJob = await findXlabelDPCustomerByJobId(uniqueID);

    req.body = {
      ...req.body,
      contact: {
        ...req.body.contact,
        phone: formattedPhone
      },
      user: {
        ...req.body.user,
        phone: formatPhoneNumber(req.body.user.phone)
      },
      existingCustomer,
      existingJob
    };
    next();
  } catch (err) {
    LOG.error(`Could not check for customer presence: %s`, err.message);
    res.status(HttpStatus.UNPROCESSABLE_ENTITY).end();
  }
};
