import { Op } from 'sequelize';
import {
  DEFAULT_HUNT_GREETING_ID,
  GLOBAL_ACCOUNT_ID
} from '../config/constants';
import Hunt from '../models/Hunt';
import DPHuntGreeting from '../models/HuntGreeting';
import HuntType from '../models/HuntType';
import { HuntGreeting } from '../types';

const _huntGreetingQuery = (accountId: number) => ({
  where: {
    [Op.or]: {
      id: DEFAULT_HUNT_GREETING_ID,
      [Op.and]: {
        private_dpuserid: null,
        greeting_active: true
      }
    }
  },
  attributes: [
    'id',
    'greeting_label',
    'greeting_file',
    'frn_dpaccountid',
    'frn_hunt_greeting_typeid'
  ],
  include: [
    {
      model: Hunt,
      as: 'hunts',
      attributes: ['id', 'hunt_label'],
      include: [{ model: HuntType, as: 'type' }],
      where: { frn_dpaccountid: accountId },
      required: false
    }
  ]
});

export const findActiveAndPublicHuntGreetingsByAccountId = (
  accountId: number
): Promise<any> =>
  DPHuntGreeting.findAll({
    ..._huntGreetingQuery(accountId),
    where: {
      ..._huntGreetingQuery(accountId).where,
      frn_dpaccountid: { [Op.in]: [accountId, GLOBAL_ACCOUNT_ID] }
    }
  });

export const findActiveAndPublicHuntGreetinsByAccountIdAndGreetingId = (
  accountId: number,
  greetingId: number
): Promise<any> =>
  DPHuntGreeting.findOne({
    ..._huntGreetingQuery(accountId),
    where: {
      ..._huntGreetingQuery(accountId).where,
      frn_dpaccountid: accountId,
      id: greetingId
    }
  });

export const createHuntGreeting = (
  accountId: number,
  greeting: HuntGreeting
): Promise<any> =>
  DPHuntGreeting.create({ ...greeting, frn_dpaccountid: accountId });

export const updateHuntGreeting = (
  huntGreetingId: number,
  accountId: number,
  greeting: HuntGreeting
): Promise<any> =>
  DPHuntGreeting.update(greeting, {
    where: { id: huntGreetingId, frn_dpaccountid: accountId }
  });

export const deactivateHuntGreeting = (
  huntGreetingId: number,
  accountId: number
): Promise<any> =>
  DPHuntGreeting.update(
    { greeting_active: false },
    { where: { id: huntGreetingId, frn_dpaccountid: accountId } }
  );
