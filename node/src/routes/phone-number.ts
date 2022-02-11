import express from 'express';
import {
  authenticate,
  hasConfigureNumbersPermission
} from '../middleware/auth';
import { createIdValidator } from '../middleware/validator';
import { isReadyToCreate } from '../middleware/phone-number';
import { RequestParamIdPlaceholder } from '../types';
import {
  getPhoneNumbers,
  checkNumbersAvailability,
  getPhoneNumber,
  updatePhoneNumber,
  deletePhoneNumber,
  createPhoneNumber,
  getPhoneNumberTypes
} from '../controllers/phone-number';

const phoneNumberRouter = express.Router();

const validateId = createIdValidator([RequestParamIdPlaceholder.ID]);

phoneNumberRouter.get(
  '/',
  authenticate,
  hasConfigureNumbersPermission,
  getPhoneNumbers
);
phoneNumberRouter.post(
  '/',
  authenticate,
  hasConfigureNumbersPermission,
  isReadyToCreate,
  createPhoneNumber
);
phoneNumberRouter.get(
  '/check-availability',
  authenticate,
  hasConfigureNumbersPermission,
  checkNumbersAvailability
);
phoneNumberRouter.get(
  '/types',
  authenticate,
  hasConfigureNumbersPermission,
  getPhoneNumberTypes
);
phoneNumberRouter.get(
  `/:${RequestParamIdPlaceholder.ID}`,
  validateId,
  authenticate,
  hasConfigureNumbersPermission,
  getPhoneNumber
);
phoneNumberRouter.patch(
  `/:${RequestParamIdPlaceholder.ID}`,
  validateId,
  authenticate,
  hasConfigureNumbersPermission,
  updatePhoneNumber
);
phoneNumberRouter.delete(
  `/:${RequestParamIdPlaceholder.ID}`,
  validateId,
  authenticate,
  hasConfigureNumbersPermission,
  deletePhoneNumber
);

export default phoneNumberRouter;
