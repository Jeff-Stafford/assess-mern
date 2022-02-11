import DPHunt from '../models/Hunt';
import DPHuntType from '../models/HuntType';
import HuntType from '../models/HuntType';
import DPHuntGreeting from '../models/HuntGreeting';
import DPHuntExtension from '../models/HuntExtension';
import DPUser from '../models/DPUser';
import DPHuntDPUser from '../models/HuntDPUser';
import { Hunt, HuntExtension } from '../types';
import HuntRingDid from '../models/HuntRingDid';
import RingDid from '../models/RingDid';

export const findHuntTypes = () => DPHuntType.findAll();

const _huntQuery = {
  where: { hunt_active: true },
  attributes: {
    exclude: [
      'frn_dpaccountid',
      'frn_hunt_typeid',
      'frn_hunt_greetingid',
      'hunt_active'
    ]
  },
  include: [
    { model: DPHuntType, as: 'type' },
    {
      model: DPHuntGreeting,
      as: 'greeting',
      attributes: { exclude: ['frn_dpaccountid', 'greeting_active'] }
    },
    {
      model: DPHuntDPUser,
      as: 'users',
      attributes: ['frn_dpuserid'],
      where: { hunt_dpuser_active: true },
      required: false,
      include: [
        {
          model: DPUser,
          as: 'user',
          attributes: ['id', 'avatar', 'name_first', 'name_last']
        }
      ]
    }
  ]
};

export const findHuntsByAccountId = (accountId: number) =>
  DPHunt.findAll({
    ..._huntQuery,
    where: { ..._huntQuery.where, frn_dpaccountid: accountId }
  });

export const findHuntByAccountIdAndHuntId = (
  accountId: number,
  huntId: number
): Promise<any> =>
  DPHunt.findOne({
    ..._huntQuery,
    where: { ..._huntQuery.where, frn_dpaccountid: accountId, id: huntId }
  });

export const createHunt = (accountId: number, hunt: Hunt): Promise<any> =>
  DPHunt.create({ ...hunt, frn_dpaccountid: accountId });

export const updateHunt = (huntId: number, accountId: number, hunt: Hunt) =>
  DPHunt.update(hunt, { where: { id: huntId, frn_dpaccountid: accountId } });

export const deactivateHunt = (huntId: number, accountId: number) =>
  DPHunt.update(
    { hunt_active: false },
    { where: { id: huntId, frn_dpaccountid: accountId } }
  );

const _huntExtensionQuery = {
  where: { extension_active: true },
  attributes: {
    exclude: [
      'frn_huntid',
      'forward_huntid',
      'extension_active',
      'fallback_huntid'
    ]
  },
  include: [
    {
      model: DPHunt,
      as: 'forward_hunt',
      attributes: ['id', 'hunt_label'],
      include: [
        { model: HuntType, as: 'type' },
        {
          model: DPHuntGreeting,
          as: 'greeting',
          attributes: ['id', 'greeting_label', 'greeting_file']
        }
      ]
    },
    {
      model: DPHunt,
      as: 'fallback_hunt',
      attributes: ['id', 'hunt_label'],
      include: [
        { model: HuntType, as: 'type' },
        {
          model: DPHuntGreeting,
          as: 'greeting',
          attributes: ['id', 'greeting_label', 'greeting_file']
        }
      ]
    }
  ]
};

export const findHuntExtensions = (huntId: number) =>
  DPHuntExtension.findAll({
    ..._huntExtensionQuery,
    where: { ..._huntExtensionQuery.where, frn_huntid: huntId }
  });

export const findHuntExtension = (huntId: number, huntExtensionId: number) =>
  DPHuntExtension.findOne({
    ..._huntExtensionQuery,
    where: {
      ..._huntExtensionQuery.where,
      id: huntExtensionId,
      frn_huntid: huntId
    }
  });

export const createHuntExtension = (huntExtension: HuntExtension) =>
  DPHuntExtension.create(huntExtension);

export const updateHuntExtension = (
  huntExtensionId: number,
  huntExtension: HuntExtension
) => DPHuntExtension.update(huntExtension, { where: { id: huntExtensionId } });

export const deactivateHuntExtension = (huntId: number, extensionId: number) =>
  DPHuntExtension.update(
    { extension_active: false },
    { where: { id: extensionId, frn_huntid: huntId } }
  );

export const findUsersByHuntId = (huntId: number) =>
  DPHuntDPUser.findAll({
    where: { frn_huntid: huntId, hunt_dpuser_active: true },
    attributes: {
      exclude: ['frn_huntid', 'frn_dpuserid', 'hunt_dpuser_active']
    },
    include: [
      {
        model: DPUser,
        as: 'user',
        attributes: {
          exclude: [
            'frn_dpaccountid',
            'user_active',
            'verificationCode',
            'verificationCodeCreatedAt',
            'frn_dpnumberid'
          ]
        }
      }
    ]
  });

export const findHuntUserRelation = (huntId: number, userId: number) =>
  DPHuntDPUser.findOne({ where: { frn_huntid: huntId, frn_dpuserid: userId } });

export const createHuntUserRelation = (huntId: number, userId: number) =>
  DPHuntDPUser.create({ frn_huntid: huntId, frn_dpuserid: userId });

export const createHuntMultipleUserRelations = (
  huntId: number,
  userIds: number[]
) =>
  DPHuntDPUser.bulkCreate(
    userIds.map((userId: number) => ({
      frn_huntid: huntId,
      frn_dpuserid: userId
    }))
  );

export const removeHuntMultipleUserRelations = (huntId: number) =>
  DPHuntDPUser.destroy({
    where: {
      frn_huntid: huntId
    }
  });

export const createHuntExtensions = (extensions: HuntExtension[]) =>
  DPHuntExtension.bulkCreate(extensions);

export const removeHuntExtensions = (huntId: number) =>
  DPHuntExtension.destroy({
    where: {
      frn_huntid: huntId
    }
  });

export const deactivateHuntUserRelation = (huntId: number, userId: number) =>
  DPHuntDPUser.update(
    { hunt_dpuser_active: false },
    { where: { frn_huntid: huntId, frn_dpuserid: userId } }
  );

export const createRelationBetweenExternalDidAndHunt = (
  externalDidId: number,
  huntId: number
) => HuntRingDid.create({ frn_huntid: huntId, frn_ring_didid: externalDidId });

export const updateRelationBetweenExternalDidAndHunt = (
  huntId: number,
  externalDidId: number
) =>
  HuntRingDid.update(
    { frn_ring_didid: externalDidId },
    { where: { frn_huntid: huntId } }
  );

export const removeRelationBetweenExternalDidAndHunt = (
  huntId: number,
  externalDidId: number
) =>
  HuntRingDid.destroy({
    where: { frn_huntid: huntId, frn_ring_didid: externalDidId }
  });

export const findDidValueByHuntId = async (huntId: number): Promise<string> => {
  const did: any = await HuntRingDid.findOne({
    where: { frn_huntid: huntId },
    include: [{ model: RingDid, as: 'ring_did' }]
  });

  return did?.ring_did?.did_value;
};
