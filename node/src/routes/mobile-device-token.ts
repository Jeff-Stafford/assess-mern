import express from 'express';

import { authenticate } from '../middleware/auth';

import {
  bodyHasDeviceToken,
  bodyHasValidProviderId,
  queryStringHasDeviceToken
} from '../middleware/mobile-device-token';

import {
  createMobileDeviceToken,
  deleteMobileDeviceToken
} from '../controllers/mobile-device-token';

const mobileDeviceTokenRouter = express.Router();

mobileDeviceTokenRouter.post(
  '/',
  authenticate,
  bodyHasDeviceToken,
  bodyHasValidProviderId,
  createMobileDeviceToken
);

mobileDeviceTokenRouter.delete(
  '/',
  authenticate,
  queryStringHasDeviceToken,
  deleteMobileDeviceToken
);

export default mobileDeviceTokenRouter;
