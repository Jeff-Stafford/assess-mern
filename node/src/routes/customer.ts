import express from 'express';
import { authenticate } from '../middleware/auth';
import { checkUserAndCustomerRelation } from '../middleware/customer-user';
import { createIdValidator } from '../middleware/validator';
import { RequestParamIdPlaceholder } from '../types';
import {
  createNote,
  checkDoesCustomerExist,
  createCustomer,
  updateCustomer,
  getXConnects
} from '../controllers/customer';

const customerRouter = express.Router();

const validateCustomerId = createIdValidator([
  RequestParamIdPlaceholder.CUSTOMER_ID
]);

customerRouter.post(
  `/:${RequestParamIdPlaceholder.CUSTOMER_ID}/notes`,
  validateCustomerId,
  authenticate,
  checkUserAndCustomerRelation,
  createNote
);
customerRouter.get('/check', authenticate, checkDoesCustomerExist);
customerRouter.post('/', authenticate, createCustomer);
customerRouter.patch(
  `/:${RequestParamIdPlaceholder.CUSTOMER_ID}`,
  validateCustomerId,
  authenticate,
  updateCustomer
);
customerRouter.get(
  `/:${RequestParamIdPlaceholder.CUSTOMER_ID}/xconnects`,
  validateCustomerId,
  authenticate,
  getXConnects
);

export default customerRouter;
