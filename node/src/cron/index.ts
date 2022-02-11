import accuLynxSyncContactsJob from './acculynx/contacts-sync';
import { getLogger } from '../helpers/logger';
import { ENVIRONMENT } from '../config/constants';

const LOG = getLogger('cron-jobs');

export default () => {
  if (ENVIRONMENT === 'production') {
    LOG.info('Starting CRON jobs...');
    accuLynxSyncContactsJob.start();
  }
};

const stopCronJobs = () => {
  LOG.info('Stopping CRON jobs...');
  if (accuLynxSyncContactsJob.running) {
    accuLynxSyncContactsJob.stop();
  }
};

process.on('SIGINT', () => {
  stopCronJobs();
  LOG.warn('Cron jobs stopped due to application termination.');
});
