import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  getNotificationSchedule,
  setNotificationSchedule
} from '../controllers/notification-schedule';

const notificationScheduleRoutes = express.Router();

notificationScheduleRoutes.get('/', authenticate, getNotificationSchedule);
notificationScheduleRoutes.post('/', authenticate, setNotificationSchedule);

export default notificationScheduleRoutes;
