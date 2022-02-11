import { Request, Response } from 'express';
import HttpStatus from 'http-status-codes';
import { getLogger } from '../helpers/logger';
import * as externalDidService from '../services/external-did';

const LOG = getLogger('external-did-controller');

export const createExternalDid = async (
  { tokenPayload, body }: Request,
  res: Response
) => {
  const { did_value, did_label } = body;
  try {
    const createdExternalDid = await externalDidService.createExternalDid({
      frn_dpaccountid: tokenPayload.accountId,
      did_label,
      did_value
    });

    res.status(HttpStatus.CREATED).json(createdExternalDid);
  } catch (err) {
    LOG.error('Create external did: %s', err.message);
    res
      .status(HttpStatus.BAD_REQUEST)
      .json({ message: 'Failed to create external did. Please try again' });
  }
};

export const getExternalDids = async (req: Request, res: Response) => {
  const { accountId } = req.tokenPayload;
  const externalDids = await externalDidService.findExternalDidsByAccountId(
    accountId
  );

  res.json(externalDids);
};

export const getExternalDid = async (
  { tokenPayload, params }: Request,
  res: Response
) => {
  const { id: didId } = params;

  const externalDid = await externalDidService.findExternalDidByDidIdAndAccountId(
    +didId,
    tokenPayload.accountId
  );
  if (!externalDid) {
    return res.status(HttpStatus.NOT_FOUND).end();
  }

  res.json(externalDid);
};

export const updateExternalDid = async (
  { tokenPayload: { accountId }, body, params }: Request,
  res: Response
) => {
  const { did_value, did_label } = body;
  const { id: didId } = params;

  try {
    await externalDidService.updateExternalDid(+didId, accountId, {
      frn_dpaccountid: accountId,
      did_label,
      did_value
    });

    res.json({ message: 'External did updated.' });
  } catch (err) {
    LOG.error('Update external did [%d]: %s', didId, err.message);
    res
      .status(HttpStatus.BAD_REQUEST)
      .json({ message: 'Failed to update external did. Please try again' });
  }
};

export const getHunts = async (req: Request, res: Response) => {
  const { id: externalDidId } = req.params;

  const hunts = await externalDidService.findHuntsByExternalDidId(
    +externalDidId
  );

  const mappedHunts = hunts.map(({ hunt }: any) => hunt);

  res.json(mappedHunts);
};

export const getExternalDidByHuntId = async (req: Request, res: Response) => {
  const { id: huntId } = req.params;

  const externalDid = await externalDidService.findExternalDidByHuntId(+huntId);

  if (!externalDid) {
    return res.status(HttpStatus.NOT_FOUND).end();
  }

  res.json(externalDid.ring_did);
};
