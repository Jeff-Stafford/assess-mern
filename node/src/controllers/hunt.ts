import { Request, Response } from 'express';
import HttpStatus from 'http-status-codes';
import { getLogger } from '../helpers/logger';
import {
  createExternalDid,
  findExternalDidByDidIdAndAccountId,
  findExternalDidByDidValueAndAccountId,
  findExternalDidByHuntId
} from '../services/external-did';
import * as huntService from '../services/hunt';
import { findByUserIdAndAccountId } from '../services/user';
import { Hunt, HuntExtension, HuntType } from '../types';

const LOG = getLogger('hunt-controller');

export const getHuntTypes = async (_: Request, res: Response) => {
  const huntTypes = await huntService.findHuntTypes();
  res.json(huntTypes);
};

export const getHunts = async (
  { tokenPayload: { accountId } }: Request,
  res: Response
) => {
  const hunts = await huntService.findHuntsByAccountId(accountId);
  const mappedHunts = hunts.map((hunt: any) => ({
    ...hunt.dataValues,
    users: hunt.users.map(({ user }: any) => user)
  }));

  res.json(mappedHunts);
};

export const getHunt = async (
  { tokenPayload: { accountId }, params }: Request,
  res: Response
) => {
  const { id: huntId } = params;
  const hunt = await huntService.findHuntByAccountIdAndHuntId(
    accountId,
    +huntId
  );

  if (!hunt) {
    return res.status(HttpStatus.NOT_FOUND).end();
  }

  let didValue;
  if (hunt.type.id === HuntType.RING_DID) {
    didValue = await huntService.findDidValueByHuntId(hunt.id);
  }

  res.json({
    ...hunt.dataValues,
    did_value: didValue,
    users: hunt.users.map(({ user }: any) => user)
  });
};

export const createHunt = async (
  { tokenPayload, body }: Request,
  res: Response
) => {
  const { hunt_label, hunt_typeid, hunt_greetingid, users } = body;
  try {
    if (!hunt_label || !hunt_typeid) {
      throw new Error('Please check your missing fields such as label or type');
    }
    const createdHunt = await huntService.createHunt(tokenPayload.accountId, {
      hunt_label,
      frn_hunt_typeid: hunt_typeid,
      frn_hunt_greetingid: hunt_greetingid
    });

    if (users?.length) {
      await huntService.createHuntMultipleUserRelations(createdHunt.id, users);
    }

    if (hunt_typeid === HuntType.RING_DID) {
      const didValue = body.did_value;
      const existingExternalDid = await findExternalDidByDidValueAndAccountId(
        didValue,
        tokenPayload.accountId
      );
      if (!existingExternalDid) {
        const createdExternalDid = await createExternalDid({
          frn_dpaccountid: tokenPayload.accountId,
          did_label: hunt_label,
          did_value: didValue
        });
        await huntService.createRelationBetweenExternalDidAndHunt(
          createdExternalDid.id,
          createdHunt.id
        );
      } else {
        await huntService.createRelationBetweenExternalDidAndHunt(
          existingExternalDid.id,
          createdHunt.id
        );
      }
    }

    res.status(HttpStatus.CREATED).json(createdHunt);
  } catch (err) {
    LOG.error('Create a hunt: %s', err.message);
    res.status(HttpStatus.BAD_REQUEST).json({ message: err.message });
  }
};

export const updateHunt = async (
  { tokenPayload, body, params }: Request,
  res: Response
) => {
  const {
    hunt_label,
    hunt_typeid,
    hunt_greetingid,
    users,
    extensions,
    did_value
  } = body;
  const { id: huntId } = params;
  try {
    const huntUpdatePayload: Hunt = {
      hunt_label,
      frn_hunt_greetingid: hunt_greetingid
    };
    if (isHuntTypeChangeable(hunt_typeid)) {
      huntUpdatePayload.frn_hunt_typeid = hunt_typeid;
    }
    if (hasHuntTypeUsersAssigned(hunt_typeid) && users) {
      await huntService.removeHuntMultipleUserRelations(+huntId);
      await huntService.createHuntMultipleUserRelations(+huntId, users);
    }
    if (hasHuntTypeExtensionsAssigned(hunt_typeid) && extensions) {
      await huntService.removeHuntExtensions(+huntId);
      const huntExtensions: HuntExtension[] = extensions.map(
        (extension: HuntExtension) => ({
          ...extension,
          frn_huntid: +huntId
        })
      );
      await huntService.createHuntExtensions(huntExtensions);
    }

    if (isHuntTypeRingDid(hunt_typeid)) {
      const ringDid = await findExternalDidByHuntId(+huntId);
      if (ringDid?.ring_did) {
        ringDid.ring_did.did_value = did_value;
        await ringDid.ring_did.save({ fields: ['did_value'] });
      }
    }

    await huntService.updateHunt(
      +huntId,
      tokenPayload.accountId,
      huntUpdatePayload
    );

    res.json({ message: 'Hunt updated.' });
  } catch (err) {
    LOG.error('Update a hunt id [%d]: %s', huntId, err.message);
    res.status(HttpStatus.BAD_REQUEST).json({ message: err.message });
  }
};

const isHuntTypeChangeable = (huntType: HuntType): boolean =>
  huntType === HuntType.USER_MULTIPLE_SIMULTANEOUS ||
  huntType === HuntType.USER_MULTIPLE_ROUNDROBIN;

const hasHuntTypeUsersAssigned = (huntType: HuntType): boolean =>
  huntType !== HuntType.BRIDGE && huntType !== HuntType.RING_DID;

const hasHuntTypeExtensionsAssigned = (huntType: HuntType): boolean =>
  huntType === HuntType.BRIDGE;

const isHuntTypeRingDid = (huntType: HuntType): boolean =>
  huntType === HuntType.RING_DID;

export const deleteHunt = async (
  { tokenPayload: { accountId }, params }: Request,
  res: Response
) => {
  const { id: huntId } = params;

  await huntService.removeHuntMultipleUserRelations(+huntId);
  await huntService.removeHuntExtensions(+huntId);
  await huntService.deactivateHunt(+huntId, accountId);

  res.json(`Hunt ${huntId} deleted.`);
};

export const getHuntExtensions = async (req: Request, res: Response) => {
  const { id: huntId } = req.params;

  const huntExtensions = await huntService.findHuntExtensions(+huntId);

  res.json(huntExtensions);
};

export const getHuntExtension = async (req: Request, res: Response) => {
  const { id: huntId, extensionId } = req.params;

  const huntExtension = await huntService.findHuntExtension(
    +huntId,
    +extensionId
  );
  if (!huntExtension) {
    return res.status(HttpStatus.NOT_FOUND).end();
  }

  res.json(huntExtension);
};

export const createHuntExtension = async (
  { tokenPayload, body, params }: Request,
  res: Response
) => {
  const { id: huntId } = params;
  const { extension_digit, extension_label, forward_huntid } = body;
  try {
    const forwardHunt = await huntService.findHuntByAccountIdAndHuntId(
      tokenPayload.accountId,
      forward_huntid
    );
    if (!forwardHunt) {
      return res.status(HttpStatus.FORBIDDEN).end();
    }
    const createdHuntExtension = await huntService.createHuntExtension({
      frn_huntid: +huntId,
      extension_digit,
      extension_label,
      forward_huntid
    });

    res.status(HttpStatus.CREATED).json(createdHuntExtension);
  } catch (err) {
    LOG.error('Create hunt extension: %s', err.message);
    res.status(HttpStatus.BAD_REQUEST).json({ message: err.message });
  }
};

export const updateHuntExtension = async (
  { tokenPayload, body, params }: Request,
  res: Response
) => {
  const { id: huntId, extensionId } = params;
  const { extension_digit, extension_label, forward_huntid } = body;
  try {
    const forwardHunt = await huntService.findHuntByAccountIdAndHuntId(
      tokenPayload.accountId,
      forward_huntid
    );
    if (!forwardHunt) {
      return res.status(HttpStatus.FORBIDDEN).end();
    }
    await huntService.updateHuntExtension(+extensionId, {
      frn_huntid: +huntId,
      extension_digit,
      extension_label,
      forward_huntid
    });

    res.json({ message: 'Hunt extension updated.' });
  } catch (err) {
    LOG.error('Update hunt extension: $s', err.message);
    res.status(HttpStatus.BAD_REQUEST).json({ message: err.message });
  }
};

export const deleteHuntExtension = async (req: Request, res: Response) => {
  const { id: huntId, extensionId } = req.params;

  await huntService.deactivateHuntExtension(+huntId, +extensionId);

  res.json(`Hunt extension ${extensionId} deleted.`);
};

export const getUsers = async (req: Request, res: Response) => {
  const { id: huntId } = req.params;

  const huntUsers = await huntService.findUsersByHuntId(+huntId);
  const mappedUsers = huntUsers.map(({ user }: any) => user);

  res.json(mappedUsers);
};

export const assignUserToHunt = async (
  { tokenPayload, body, params }: Request,
  res: Response
) => {
  const { id: huntId } = params;
  const { user_id } = body;
  try {
    const foundUser = await findByUserIdAndAccountId(
      user_id,
      tokenPayload.accountId
    );
    if (!foundUser) {
      return res
        .status(HttpStatus.FORBIDDEN)
        .json({ message: 'No permission to access user resource.' });
    }
    const existingHuntUserRelation = await huntService.findHuntUserRelation(
      +huntId,
      user_id
    );
    if (!existingHuntUserRelation) {
      const createdRelation = await huntService.createHuntUserRelation(
        +huntId,
        user_id
      );
      return res.status(HttpStatus.CREATED).json(createdRelation);
    }
    existingHuntUserRelation.set('hunt_dpuser_active', true);
    await existingHuntUserRelation.save();

    return res.json(existingHuntUserRelation);
  } catch (err) {
    LOG.error(
      'Create relation between hunt [%d] and user [%d]: %s',
      huntId,
      user_id,
      err.message
    );
    res.status(HttpStatus.BAD_REQUEST).json({ message: err.message });
  }
};

export const removeUserFromHunt = async (req: Request, res: Response) => {
  const { id: huntId, userId } = req.params;
  try {
    await huntService.deactivateHuntUserRelation(+huntId, +userId);

    res.json({ message: 'User removed from hunt.' });
  } catch (err) {
    LOG.error(
      'Remove relation between hunt [%d] and user [%d]: %s',
      huntId,
      userId,
      err.message
    );
    res.status(HttpStatus.BAD_REQUEST).json({ message: err.message });
  }
};

export const createHuntExternalDidRelation = async (
  { tokenPayload, body, params }: Request,
  res: Response
) => {
  const { id: huntId } = params;
  const { external_did_id } = body;

  const hasPermission = await _hasPermissionToAccessExternalDid(
    tokenPayload.accountId,
    external_did_id
  );
  if (!hasPermission) {
    return res
      .status(HttpStatus.FORBIDDEN)
      .json({ message: 'No permission to access external did resource.' });
  }

  try {
    const createdRelation = await huntService.createRelationBetweenExternalDidAndHunt(
      external_did_id,
      +huntId
    );

    res.status(HttpStatus.CREATED).json(createdRelation);
  } catch (err) {
    LOG.error(
      'Create relation between hunt [%d] and external did [%d]: %s',
      huntId,
      external_did_id,
      err.message
    );
    res.status(HttpStatus.BAD_REQUEST).json({ message: err.message });
  }
};

export const updateHuntExternalDidRelation = async (
  { tokenPayload, body, params }: Request,
  res: Response
) => {
  const { id: huntId } = params;
  const { external_did_id } = body;

  const hasPermission = await _hasPermissionToAccessExternalDid(
    tokenPayload.accountId,
    external_did_id
  );
  if (!hasPermission) {
    return res
      .status(HttpStatus.FORBIDDEN)
      .json({ message: 'No permission to access external did resource.' });
  }

  try {
    await huntService.updateRelationBetweenExternalDidAndHunt(
      +huntId,
      external_did_id
    );

    res.json({ message: 'Relation updated.' });
  } catch (err) {
    LOG.error(
      'Update relation between hunt [%d] and external did [%d]: %s',
      huntId,
      external_did_id,
      err.message
    );
    res.status(HttpStatus.BAD_REQUEST).json({ message: err.message });
  }
};

export const deleteHuntExternalDidRelation = async (
  req: Request,
  res: Response
) => {
  const { id: huntId, externalDidId } = req.params;
  try {
    await huntService.removeRelationBetweenExternalDidAndHunt(
      +huntId,
      +externalDidId
    );

    res.json({ message: 'Relation deleted.' });
  } catch (err) {
    LOG.error(
      'Remove relation between hunt [%d] and external did [%d]: %s',
      huntId,
      externalDidId,
      err.message
    );
    res.status(HttpStatus.BAD_REQUEST).json({ message: err.message });
  }
};

const _hasPermissionToAccessExternalDid = async (
  accountId: number,
  externalDidId: number
): Promise<boolean> => {
  const externalDid = await findExternalDidByDidIdAndAccountId(
    externalDidId,
    accountId
  );

  return externalDid !== null;
};
