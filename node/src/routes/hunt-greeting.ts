import express from 'express';
import {
  authenticate,
  hasConfigureNumbersPermission
} from '../middleware/auth';
import {
  createIdValidator,
  createTenantValidator
} from '../middleware/validator';
import { isReadOnly } from '../middleware/hunt-greeting';
import { RequestParamIdPlaceholder } from '../types';
import {
  getGreetings,
  getGreeting,
  createGreeting,
  updateGreeting,
  deleteGreeting
} from '../controllers/hunt-greeting';
import HuntGreeting from '../models/HuntGreeting';

const huntGreetingRouter = express.Router();

const validateId = createIdValidator([RequestParamIdPlaceholder.ID]);
const validateGreetingTenancy = createTenantValidator(
  HuntGreeting,
  RequestParamIdPlaceholder.ID
);

huntGreetingRouter.get(
  '/',
  authenticate,
  hasConfigureNumbersPermission,
  getGreetings
);
huntGreetingRouter.get(
  `/:${RequestParamIdPlaceholder.ID}`,
  validateId,
  authenticate,
  validateGreetingTenancy,
  hasConfigureNumbersPermission,
  getGreeting
);
huntGreetingRouter.post(
  '/',
  authenticate,
  hasConfigureNumbersPermission,
  createGreeting
);
huntGreetingRouter.patch(
  `/:${RequestParamIdPlaceholder.ID}`,
  validateId,
  authenticate,
  isReadOnly,
  validateGreetingTenancy,
  hasConfigureNumbersPermission,
  updateGreeting
);
huntGreetingRouter.delete(
  `/:${RequestParamIdPlaceholder.ID}`,
  validateId,
  authenticate,
  isReadOnly,
  validateGreetingTenancy,
  hasConfigureNumbersPermission,
  deleteGreeting
);

export default huntGreetingRouter;
