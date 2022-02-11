import express from 'express';
import {
  authenticate,
  hasConfigureNumbersPermission
} from '../middleware/auth';
import {
  createIdValidator,
  createTenantValidator
} from '../middleware/validator';
import { RequestParamIdPlaceholder } from '../types';
import {
  getExternalDids,
  getExternalDid,
  createExternalDid,
  updateExternalDid,
  getHunts,
  getExternalDidByHuntId
} from '../controllers/external-did';
import RingDid from '../models/RingDid';
import Hunt from '../models/Hunt';

const externalDidRouter = express.Router();

const validateId = createIdValidator([RequestParamIdPlaceholder.ID]);
const validateExternalDidTenancy = createTenantValidator(
  RingDid,
  RequestParamIdPlaceholder.ID
);
const validateHuntTenancy = createTenantValidator(
  Hunt,
  RequestParamIdPlaceholder.ID
);

externalDidRouter.get(
  '/',
  authenticate,
  hasConfigureNumbersPermission,
  getExternalDids
);
externalDidRouter.get(
  `/:${RequestParamIdPlaceholder.ID}`,
  validateId,
  authenticate,
  validateExternalDidTenancy,
  hasConfigureNumbersPermission,
  getExternalDid
);
externalDidRouter.post(
  '/',
  authenticate,
  hasConfigureNumbersPermission,
  createExternalDid
);
externalDidRouter.patch(
  `/:${RequestParamIdPlaceholder.ID}`,
  validateId,
  authenticate,
  validateExternalDidTenancy,
  hasConfigureNumbersPermission,
  updateExternalDid
);
externalDidRouter.get(
  `/:${RequestParamIdPlaceholder.ID}/hunts`,
  validateId,
  authenticate,
  validateExternalDidTenancy,
  hasConfigureNumbersPermission,
  getHunts
);
externalDidRouter.get(
  `/hunts/:${RequestParamIdPlaceholder.ID}`,
  validateId,
  authenticate,
  validateHuntTenancy,
  hasConfigureNumbersPermission,
  getExternalDidByHuntId
);

export default externalDidRouter;
