import { Request, Response } from 'express';
import HttpStatus from 'http-status-codes';
import { getLogger } from '../helpers/logger';
import * as ringService from '../services/ring';
import { findByUserIdAndAccountId } from '../services/user';
import { RingUserType, Ring, RingRequestBody } from '../types';

const LOG = getLogger('ring-controller');

export const getRingTypes = async (_: Request, res: Response) => {
  const usersRingTypes = await ringService.findUserRingTypes();

  res.json(usersRingTypes);
};

export const getRings = async (
  { tokenPayload: { accountId } }: Request,
  res: Response
) => {
  const usersRings = await ringService.findUsersRingsByAccountId(accountId);
  res.json(usersRings);
};

const _prepareRingForCreateOrUpdate = (
  accountId: number,
  requestBody: RingRequestBody
): Ring => {
  const { user_id, ring_type_id, ring_value, ring_participate } = requestBody;
  const ringValue =
    ring_type_id === RingUserType.WEB_RTC_CLIENT
      ? `client_${accountId}_${user_id}`
      : ring_value;
  return {
    frn_dpuserid: user_id,
    frn_ring_dpuser_typeid: ring_type_id,
    ring_value: ringValue,
    ring_participate
  };
};

export const createRing = async (
  { tokenPayload: { accountId }, body }: Request,
  res: Response
) => {
  const { user_id } = body;
  try {
    const user = await findByUserIdAndAccountId(user_id, accountId);
    if (!user) {
      return res
        .status(HttpStatus.FORBIDDEN)
        .json({ message: 'No permission to access user resource.' });
    }
    const createdRing = await ringService.createRing(
      _prepareRingForCreateOrUpdate(accountId, body)
    );

    res.status(HttpStatus.CREATED).json(createdRing);
  } catch (err) {
    LOG.error('Create ring for user [%d]: %s', body.user_id, err.message);
    res.status(HttpStatus.BAD_REQUEST).json({ message: err.message });
  }
};

export const updateRing = async (
  { tokenPayload: { accountId }, body, params }: Request,
  res: Response
) => {
  const { id: ringId } = params;
  const { user_id } = body;
  try {
    const user = await findByUserIdAndAccountId(user_id, accountId);
    if (!user) {
      return res
        .status(HttpStatus.FORBIDDEN)
        .json({ message: 'No permission to access user resource.' });
    }
    await ringService.updateRing(
      +ringId,
      _prepareRingForCreateOrUpdate(accountId, body)
    );

    res.json({ message: 'Ring updated.' });
  } catch (err) {
    LOG.error(
      'Update ring [%d] for user [%d]: %s',
      ringId,
      body.user_id,
      err.message
    );
    res.status(HttpStatus.BAD_REQUEST).json({ message: err.message });
  }
};

export const deleteRing = async (
  { tokenPayload: { accountId }, body, params }: Request,
  res: Response
) => {
  const { id: ringId } = params;
  const { user_id } = body;

  const user = await findByUserIdAndAccountId(user_id, accountId);
  if (!user) {
    return res
      .status(HttpStatus.FORBIDDEN)
      .json({ message: 'No permission to access user resource.' });
  }
  await ringService.deactivateRing(+ringId);

  res.json({ message: 'Ring deleted.' });
};
