import cron from 'cron';
import accuLynxClient from '../../api/acculynx';
import { findXConnectDPAccountByXConnectId } from '../../services/xconnect';
import { XConnect } from '../../types/xconnect';
import { getLogger } from '../../helpers/logger';
import { formatPhoneNumber } from '../../utils';
import {
  findCustomerPhoneNumbersByPhoneNumbersAndAccountId,
  createManyCustomers
} from '../../services/customer';

const LOG = getLogger('acculynx-contact-sync');

const CRON_CONFIG = {
  //     ss mm HH - every day at midnight
  TIME: '00 00 00 * * *',
  TIME_ZONE: 'America/Los_Angeles'
};

const PAGE_SIZE = 50;

const sync = async () => {
  const xConnectDPAccounts = await findXConnectDPAccountByXConnectId(
    XConnect.ACCU_LYNX
  );

  for (const xConnectDPAccount of xConnectDPAccounts) {
    const apiKey = xConnectDPAccount.api_key;
    const accountId = xConnectDPAccount.frn_dpaccountid;
    if (!apiKey) {
      LOG.warn(
        'Account %d has no AccuLynx API Key for contacts sync',
        accountId
      );
      continue;
    }

    let errorCount = 0;
    let contactsCount = 1;
    let page = 0;

    while (page * PAGE_SIZE < contactsCount && errorCount < 3) {
      try {
        const contactsData = await fetchContactsWithDelay(page, apiKey);
        contactsCount = contactsData.count;
        const externalContacts = contactsData.items
          .flatMap((contact: any) => {
            return contact.phoneNumbers.map((phoneNumber: any) => {
              return {
                customer_name: `${contact.firstName} ${contact.lastName}`,
                customer_number: formatPhoneNumber(phoneNumber.number),
                last_update_action: 'Customer created by AccuLynx sync',
                frn_dpaccountid: accountId
              };
            });
          })
          .filter(
            (contact: any, index: number, contacts: any[]) =>
              contacts.findIndex(
                (c: any) => c.customer_number === contact.customer_number
              ) === index
          );
        const externalPhoneNumbers = externalContacts.map(
          (c: any) => c.customer_number
        );
        const localPhoneNumbers = await findCustomerPhoneNumbersByPhoneNumbersAndAccountId(
          externalPhoneNumbers,
          accountId
        );
        const contactsToInsert = externalContacts.filter(
          (ec: any) => localPhoneNumbers.indexOf(ec.customer_number) === -1
        );
        await createManyCustomers(contactsToInsert);
      } catch (error) {
        errorCount++;
        LOG.error(
          'Failed to sync AccuLynx contacts %d time(s). Account %d on page start index %d. Error: %s',
          errorCount,
          accountId,
          page * PAGE_SIZE,
          error.message
        );
      }
      page++;
    }
  }
};

const fetchContactsWithDelay = (page: number, apiKey: string): Promise<any> =>
  new Promise((resolve, reject) => {
    setTimeout(async () => {
      try {
        const contacts = await accuLynxClient.get('/contacts', {
          params: {
            includes: 'phoneNumber',
            pageSize: PAGE_SIZE,
            pageStartIndex: page * PAGE_SIZE
          },
          headers: {
            Authorization: `Bearer ${apiKey}`
          }
        });
        resolve(contacts.data);
      } catch (error) {
        reject(error);
      }
    }, 3000);
  });

const job = new cron.CronJob(
  CRON_CONFIG.TIME,
  sync,
  null,
  false,
  CRON_CONFIG.TIME_ZONE
);

export default job;
