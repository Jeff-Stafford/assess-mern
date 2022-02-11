import express from 'express';
import { getCall } from '../controllers/call';
import { authenticate } from '../middleware/auth';
import { customerBelongsToSameAccountThroughCall } from '../middleware/customer-user';
import { createIdValidator } from '../middleware/validator';
import { RequestParamIdPlaceholder } from '../types';

const callRouter = express.Router();

const validateId = createIdValidator([RequestParamIdPlaceholder.ID]);

callRouter.get(
  '/:id',
  validateId,
  authenticate,
  customerBelongsToSameAccountThroughCall,
  getCall
);

export default callRouter;
