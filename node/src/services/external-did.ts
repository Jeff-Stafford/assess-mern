import DPRingDid from '../models/RingDid';
import Hunt from '../models/Hunt';
import HuntRingDid from '../models/HuntRingDid';
import { ExternalDid } from '../types';
import HuntType from '../models/HuntType';
import HuntGreeting from '../models/HuntGreeting';
import RingDid from '../models/RingDid';

export const createExternalDid = (externalDid: ExternalDid): Promise<any> =>
  DPRingDid.create(externalDid);

export const updateExternalDid = (
  didId: number,
  accountId: number,
  externalDid: ExternalDid
) =>
  DPRingDid.update(externalDid, {
    where: { id: didId, frn_dpaccountid: accountId }
  });

const _externalDidsQuery = {
  attributes: {
    exclude: ['frn_dpaccountid']
  }
};

export const findExternalDidsByAccountId = (accountId: number) =>
  DPRingDid.findAll({
    ..._externalDidsQuery,
    where: { frn_dpaccountid: accountId }
  });

export const findExternalDidByDidIdAndAccountId = (
  didId: number,
  accountId: number
) =>
  DPRingDid.findOne({
    ..._externalDidsQuery,
    where: { id: didId, frn_dpaccountid: accountId }
  });

export const findHuntsByExternalDidId = (externalDidId: number) =>
  HuntRingDid.findAll({
    where: { frn_ring_didid: externalDidId },
    attributes: ['id'],
    include: [
      {
        model: Hunt,
        as: 'hunt',
        attributes: ['id', 'hunt_label'],
        include: [
          { model: HuntType, as: 'type' },
          {
            model: HuntGreeting,
            as: 'greeting',
            attributes: ['id', 'greeting_label', 'greeting_file']
          }
        ]
      }
    ]
  });

export const findExternalDidByHuntId = (huntId: number): Promise<any> =>
  HuntRingDid.findOne({
    where: { frn_huntid: huntId },
    attributes: { exclude: ['frn_huntid', 'frn_ring_didid'] },
    include: [
      {
        model: DPRingDid,
        as: 'ring_did',
        attributes: { exclude: ['frn_dpaccountid'] }
      }
    ]
  });

export const findExternalDidByDidValueAndAccountId = (
  didValue: string,
  accountId: number
): Promise<any> =>
  RingDid.findOne({
    where: { did_value: didValue, frn_dpaccountid: accountId }
  });
