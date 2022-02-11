import { Request, Response } from 'express';
import HttpStatus from 'http-status-codes';
import { getLogger } from '../helpers/logger';
import {
  getNoteFromLatestCustomerNoteEvent,
  findLastUpdateActionByCustomerId,
  findAccountByCustomerId,
  updateCustomerByAccountIdAndCustomerNumber
} from '../services/customer';
import { findUserById } from '../services/user';
import { findCustomerAndCallTypeByCallId } from '../services/call';
import { EventEmitter } from '../types';
import { findXConnectDPAccountByXConnectIdAndAccountId } from '../services/xconnect';
import { XConnect } from '../types/xconnect';
import { generateMySqlNOWFunction } from '../utils';

const LOG = getLogger('lambda-controller');

export const reactToLatestCustomerNoteEvent = (req: Request, res: Response) => {
  const {
    noteid: noteId,
    post_type: postType,
    userid: userId,
    customerid: customerId
  } = req.body;
  // Due to DB replication
  setTimeout(async () => {
    try {
      const socketEventEmitter: EventEmitter = req.app.get(
        'socketEventEmitter'
      );
      if (postType === 'delete') {
        const { frn_dpaccountid } = await findAccountByCustomerId(customerId);
        const { last_update_action } = await findLastUpdateActionByCustomerId(
          customerId
        );
        socketEventEmitter.emitLatestDeletedCustomerNoteEvent(
          frn_dpaccountid,
          noteId,
          last_update_action
        );
        LOG.info(
          'Delete note socket event sent note [%d], user [%d], customer [%d], account [%d]',
          noteId,
          userId,
          customerId,
          frn_dpaccountid
        );
        return res.end();
      }
      const note = await getNoteFromLatestCustomerNoteEvent(noteId);
      if (!note) {
        LOG.info('Note [%d] not found', noteId);
        return res.status(HttpStatus.NOT_FOUND).end();
      }
      socketEventEmitter.emitLatestCustomerNoteEvent(
        note.customer.frn_dpaccountid,
        {
          id: note.id,
          note_comment: note.note_comment,
          note_file: note.note_file,
          note_url: note.note_url,
          datetime: note.note_datetime,
          last_update_action: note.customer.last_update_action,
          customer_id: note.customer.id,
          user: note.user,
          note_type: note.type.type_description,
          transaction_reference: note.transaction_reference,
          show_details: note.show_details,
          note_image: note.note_image
        },
        postType
      );
      LOG.info(
        '[%s] note socket event sent note [%d], user [%d], customer [%d], account [%d]',
        postType,
        noteId,
        userId,
        customerId,
        note.customer.frn_dpaccountid
      );
      res.end();
    } catch (err) {
      LOG.error(
        'Error while broadcasting recently added customer notes: %s',
        err.message
      );
      res
        .status(HttpStatus.BAD_REQUEST)
        .json({ message: 'Could not broadcast the notes.' });
    }
  }, 1000);
};

export const reactToCall = async (req: Request, res: Response) => {
  const { e_user: userId, e_call: callId } = req.body;
  try {
    const user = await findUserById(userId);
    if (!user) {
      return res
        .status(HttpStatus.NOT_FOUND)
        .json({ message: `User ${userId} not found.` });
    }
    const callAndCustomer = await findCustomerAndCallTypeByCallId(callId);
    const socketEventEmitter: EventEmitter = req.app.get('socketEventEmitter');
    socketEventEmitter.emitCallEvent(user.frn_dpaccountid, {
      call: {
        id: callId,
        type: callAndCustomer.callType
      },
      user: {
        id: user.id,
        firstName: user.name_first,
        lastName: user.name_last
      },
      customer: callAndCustomer.customer
    });
    res.end();
  } catch (err) {
    LOG.error('Error while broadcasting the call: %s', err.message);
    res
      .status(HttpStatus.BAD_REQUEST)
      .json({ message: 'Could not broadcast the call.' });
  }
};

export const reactToStatusDisplayChangeEvent = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { user_id, status_display } = req.body;
  const socketEventEmitter: EventEmitter = req.app.get('socketEventEmitter');
  const user = await findUserById(user_id);
  if (!user) {
    res.status(HttpStatus.NOT_FOUND).json({
      message: `User ${user_id} not found.`
    });
    return;
  }
  try {
    socketEventEmitter.emitUserStatusDisplayChangedEvent(user.frn_dpaccountid, {
      user_id,
      status_display
    });
    res.end();
  } catch (err) {
    LOG.error(
      'Error while broadcasting the status display change: %s',
      err.message
    );
    res
      .status(HttpStatus.BAD_REQUEST)
      .json({ message: 'Could not broadcast the status display change.' });
  }
};

export const getAccuLynxApiKey = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { accountId } = req.params;
  const xConnectAccount = await findXConnectDPAccountByXConnectIdAndAccountId(
    XConnect.ACCU_LYNX,
    +accountId
  );
  if (!xConnectAccount?.api_key) {
    res.status(HttpStatus.NOT_FOUND).json({
      message: `API key for account ${accountId} not found.`
    });
    return;
  }
  res.json({ apiKey: xConnectAccount.api_key });
};

export const updateCustomer = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { accountId } = req.params;
  const { customerNumber, customerName } = req.body;
  try {
    await updateCustomerByAccountIdAndCustomerNumber(
      +accountId,
      customerNumber,
      {
        customer_name: customerName,
        last_update_action: 'Updated by AccuLynx lookup',
        last_update: generateMySqlNOWFunction()
      }
    );
    LOG.info(
      'Customer updated. Account %d and phone number %s.',
      accountId,
      customerNumber
    );
    res.json({ message: 'Customer updated.' });
  } catch (error) {
    LOG.error(
      'Unable to update the customer for account %d and phone number %s: %s',
      accountId,
      customerNumber,
      error.message
    );
    res.status(HttpStatus.BAD_REQUEST).json({ message: error.message });
  }
};
