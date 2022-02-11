import express from 'express';
import { authenticate } from '../middleware/auth';
import { prepareAccuLynxJobsData } from '../middleware/browser-extension';
import { handleAccuLynxJobsData } from '../controllers/browser-extension';

const browserExtensionRouter = express.Router();

browserExtensionRouter.post(
  '/acculynx/jobs',
  authenticate,
  prepareAccuLynxJobsData,
  handleAccuLynxJobsData
);

export default browserExtensionRouter;
