import { Request, Response } from 'express';
import HttpStatus from 'http-status-codes';
import * as huntGreetingService from '../services/hunt-greeting';
import { huntGreetingFileUploader } from '../helpers/file-manager';
import { getLogger } from '../helpers/logger';
import {
  GLOBAL_ACCOUNT_ID,
  STATIC_CONTENT_BASE_URL
} from '../config/constants';
import { HuntGreeting } from '../types';

const LOG = getLogger('hunt-greeting-controller');

export const getGreetings = async (
  { tokenPayload }: Request,
  res: Response
) => {
  const huntGreetings = await huntGreetingService.findActiveAndPublicHuntGreetingsByAccountId(
    tokenPayload.accountId
  );

  res.json(
    huntGreetings.map(({ dataValues }: any) => {
      const { frn_dpaccountid, ...restOfHuntGreeting } = dataValues;
      return {
        ...restOfHuntGreeting,
        is_global: frn_dpaccountid === GLOBAL_ACCOUNT_ID
      };
    })
  );
};

export const getGreeting = async (
  { tokenPayload: { accountId }, params: { id } }: Request,
  res: Response
) => {
  const huntGreeting = await huntGreetingService.findActiveAndPublicHuntGreetinsByAccountIdAndGreetingId(
    accountId,
    +id
  );

  if (!huntGreeting) {
    return res.status(HttpStatus.NOT_FOUND).end();
  }

  res.json(huntGreeting);
};

const _uploadSingleFile = huntGreetingFileUploader('greeting_file');

const _prepareHuntGreetingForCreateOrUpdate = (
  req: Request & { file: any }
): HuntGreeting => {
  return {
    greeting_label: req.body.greeting_label,
    greeting_tts: req.body.greeting_tts,
    greeting_tts_voice: req.body.greeting_tts_voice,
    greeting_file: req.file && `${STATIC_CONTENT_BASE_URL}/${req.file.key}`,
    frn_hunt_greeting_typeid: +req.body.greeting_type
  };
};

export const createGreeting = async (
  req: Request & { file: any },
  res: Response
) => {
  const { accountId } = req.tokenPayload;
  _uploadSingleFile(req, res, async (err: any) => {
    if (err) {
      LOG.error('Upload single file while creating greeting: %s', err.message);
      return res
        .status(HttpStatus.UNPROCESSABLE_ENTITY)
        .json({ message: 'Unable to upload the hunt greeting file.' });
    }
    const huntGreeting = _prepareHuntGreetingForCreateOrUpdate(req);
    try {
      const createdHuntGreeting = await huntGreetingService.createHuntGreeting(
        accountId,
        huntGreeting
      );

      res.json(createdHuntGreeting);
    } catch (err) {
      LOG.error('Create Hunt Greeting: %s', err.message);
      res.status(HttpStatus.BAD_REQUEST).json({
        message: 'Could not create greeting. Please try again later.'
      });
    }
  });
};

export const updateGreeting = (req: Request & { file: any }, res: Response) => {
  const { accountId } = req.tokenPayload;
  const { id: huntGreetingId } = req.params;
  _uploadSingleFile(req, res, async (err: any) => {
    if (err) {
      LOG.error('Upload single file while updating greeting: %s', err.message);
      return res
        .status(HttpStatus.UNPROCESSABLE_ENTITY)
        .json({ message: 'Unable to upload the hunt greeting file.' });
    }

    try {
      await huntGreetingService.updateHuntGreeting(
        +huntGreetingId,
        accountId,
        _prepareHuntGreetingForCreateOrUpdate(req)
      );

      res.json({ message: 'Hunt Greeting updated.' });
    } catch (err) {
      LOG.error(
        'Unable to update Hunt Greeting id [%d]: %s',
        huntGreetingId,
        err.message
      );
      res.status(HttpStatus.BAD_REQUEST).json({
        message: 'Could not update greeting. Please try again later.'
      });
    }
  });
};

export const deleteGreeting = async (
  { tokenPayload: { accountId }, params }: Request,
  res: Response
) => {
  const { id: huntGreetingId } = params;

  await huntGreetingService.deactivateHuntGreeting(+huntGreetingId, accountId);

  res.json({ message: 'Hunt Greeting deactivated.' });
};
