import { Request, Response } from 'express';
import HttpStatus from 'http-status-codes';
import { getLogger } from '../helpers/logger';
import * as callService from '../services/call';

const LOG = getLogger('call-controller');

export const getCall = async (
  { tokenPayload, params }: Request,
  res: Response
): Promise<void> => {
  const { id: callId } = params;
  try {
    const call = await callService.findCallData(
      +callId,
      tokenPayload.accountId
    );
    if (!call) {
      return res.status(HttpStatus.NOT_FOUND).end();
    }
    res.json(call);
  } catch (error) {
    LOG.error('Get call data: %s', error.message);
    res
      .status(HttpStatus.BAD_REQUEST)
      .json({ message: 'Unable to get call data.' });
  }
};
