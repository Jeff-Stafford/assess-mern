import { Request, Response } from 'express';
import HttpStatus from 'http-status-codes';
import { createCustomer } from '../services/customer';
import { createXlabelDPCustomer } from '../services/xlabel';
import { AccuLynx } from '../types/xlabel';
import {
  subscribeToCustomer,
  hasUserRelationToCustomer
} from '../services/user';
import { getLogger } from '../helpers/logger';

const LOG = getLogger('acculynx-controller');

export const handleAccuLynxJobsData = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { contact, nextStep, existingCustomer, existingJob } = req.body;
  try {
    let customerId = existingCustomer?.id;
    if (!existingCustomer) {
      const createdCustomer = await createCustomer({
        customer_number: contact.phone,
        customer_name: contact.name,
        frn_dpaccountid: req.tokenPayload.accountId
      });
      customerId = createdCustomer.id;
    }

    if (!existingJob) {
      await createXlabelDPCustomer(
        AccuLynx.JOB_ID,
        contact.uniqueID,
        customerId
      );
      await createXlabelDPCustomer(AccuLynx.NEXT_STEP, nextStep, customerId);
      await createXlabelDPCustomer(
        AccuLynx.PROJECT_ADDRESS,
        contact.address,
        customerId
      );
    }

    const alreadySubscribedToCustomer = await hasUserRelationToCustomer(
      req.tokenPayload.id,
      customerId
    );
    if (!alreadySubscribedToCustomer) {
      await subscribeToCustomer(req.tokenPayload.id, customerId);
    }

    res.json({ message: `AccuLynx job ${contact.uniqueID} saved.` });
    LOG.info(
      'AccuLynx job %s created for customer %d',
      contact.uniqueID,
      customerId
    );
  } catch (err) {
    res
      .status(HttpStatus.BAD_REQUEST)
      .json({ message: 'Could not save AccuLynx job.' });
    LOG.error('Unable to save AccuLynx job %s.', err.message);
  }
};
