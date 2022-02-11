import express from 'express';
import { authenticateBaseApp } from '../middleware/auth';
import { createIdValidator } from '../middleware/validator';
import { RequestParamIdPlaceholder } from '../types';
import {
  getAccounts,
  getAccount,
  createAccount,
  getAvailableNumbers,
  getUserToken
} from '../controllers/base-app';
import { validatePayload } from '../middleware/base-app';

const baseAppRouter = express.Router();

const validateId = createIdValidator([RequestParamIdPlaceholder.ID]);

baseAppRouter.get('/accounts', authenticateBaseApp, getAccounts);
baseAppRouter.get('/accounts/:id', authenticateBaseApp, validateId, getAccount);
baseAppRouter.post(
  '/accounts',
  authenticateBaseApp,
  validatePayload,
  createAccount
);
baseAppRouter.get(
  '/available-numbers',
  authenticateBaseApp,
  getAvailableNumbers
);

baseAppRouter.get('/user-token', authenticateBaseApp, getUserToken);

export default baseAppRouter;
