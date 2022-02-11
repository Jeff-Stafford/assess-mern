import express from 'express';
import { authenticate, hasConfigureUsersPermission } from '../middleware/auth';
import { createIdValidator } from '../middleware/validator';
import { RequestParamIdPlaceholder } from '../types';
import {
  getRings,
  createRing,
  updateRing,
  deleteRing,
  getRingTypes
} from '../controllers/ring';

const ringRouter = express.Router();

const validateId = createIdValidator([RequestParamIdPlaceholder.ID]);

ringRouter.get(
  '/types',
  authenticate,
  hasConfigureUsersPermission,
  getRingTypes
);
ringRouter.get('/', authenticate, hasConfigureUsersPermission, getRings);
ringRouter.post('/', authenticate, hasConfigureUsersPermission, createRing);
ringRouter.patch(
  `/:${RequestParamIdPlaceholder.ID}`,
  validateId,
  authenticate,
  hasConfigureUsersPermission,
  updateRing
);
ringRouter.delete(
  `/:${RequestParamIdPlaceholder.ID}`,
  validateId,
  authenticate,
  hasConfigureUsersPermission,
  deleteRing
);

export default ringRouter;
