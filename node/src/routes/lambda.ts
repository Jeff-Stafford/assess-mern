import express from 'express';
import { checkCustomHeader } from '../middleware/lambda';
import {
  reactToCall,
  reactToLatestCustomerNoteEvent,
  reactToStatusDisplayChangeEvent,
  getAccuLynxApiKey,
  updateCustomer
} from '../controllers/lambda';

const lambdaRouter = express.Router();

lambdaRouter.post(
  '/customer-notes',
  checkCustomHeader,
  reactToLatestCustomerNoteEvent
);
lambdaRouter.post('/calls', checkCustomHeader, reactToCall);
lambdaRouter.post(
  '/status-display',
  checkCustomHeader,
  reactToStatusDisplayChangeEvent
);
lambdaRouter.get(
  '/acculynx/:accountId/api-key',
  checkCustomHeader,
  getAccuLynxApiKey
);
lambdaRouter.put('/customers/:accountId', checkCustomHeader, updateCustomer);

export default lambdaRouter;
