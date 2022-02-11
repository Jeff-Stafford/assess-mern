import express from 'express';
import { getHealthStatus, subscribeToNewsletter } from '../controllers/common';

const commonRouter = express.Router();

commonRouter.get('/health', getHealthStatus);
commonRouter.post('/newsletter/subscriptions', subscribeToNewsletter);

export default commonRouter;
