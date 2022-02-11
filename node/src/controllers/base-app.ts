import { Request, Response } from 'express';
import HttpStatus from 'http-status-codes';
import * as accountService from '../services/account';
import {
  getAvailableNumbersByAreaCode,
  updatePhoneNumber
} from '../services/phone-number';
import { getLogger } from '../helpers/logger';
import { DEFAULT_HUNT_GREETING_ID } from '../config/constants';
import { provisionNumber } from '../helpers/twilio';
import {
  PhoneNumberType,
  HuntType,
  RingUserType,
  RingParticipatePriority,
  UserPermission
} from '../types';
import { createCustomer } from '../services/customer';
import { createHunt, createHuntUserRelation } from '../services/hunt';
import * as userService from '../services/user';
import { createRing } from '../services/ring';
import { assignPermissionToUser } from '../services/permission';
import { generateToken } from '../security';

const LOG = getLogger('base-app-controller');

export const getAccounts = async (
  req: Request,
  res: Response
): Promise<void> => {
  const activeAccounts = await accountService.findActiveAccounts();
  res.json(activeAccounts);
};

export const getAccount = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  const activeAccount = await accountService.findActiveAccountById(+id);
  if (!activeAccount) {
    return res.status(HttpStatus.NOT_FOUND).end();
  }
  res.json(activeAccount);
};

export const createAccount = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { account, user } = req.body;
  try {
    const createdAccount = await accountService.createAccount(
      account.name,
      account.logo
    );
    await createHunt(createdAccount.id, {
      hunt_label: 'General Voicemail Box',
      frn_hunt_typeid: HuntType.VOICEMAIL_GENERAL,
      frn_hunt_greetingid: DEFAULT_HUNT_GREETING_ID
    });

    await provisionNumber(
      account.number,
      'Main line',
      createdAccount.id,
      PhoneNumberType.MAIN_LINE
    );
    const userNumberId = await provisionNumber(
      user.number,
      `${user.name_first} ${user.name_last}`,
      createdAccount.id,
      PhoneNumberType.INDIVIDUAL_USER
    );
    const userAsCustomer = await createCustomer({
      customer_number: user.number,
      customer_name: `${user.name_first} ${user.name_last}`,
      frn_dpaccountid: createdAccount.id,
      textable: true
    });
    const voiceMailHuntForUser = await createHunt(createdAccount.id, {
      hunt_label: `${user.name_first} ${user.name_last} Voicemail`,
      frn_hunt_typeid: HuntType.VOICEMAIL,
      frn_hunt_greetingid: DEFAULT_HUNT_GREETING_ID
    });

    const createdUser = await userService.createUser({
      name_first: user.name_first,
      name_last: user.name_last,
      timezone_offset: createdAccount.timezone_offset_default,
      email: user.email,
      frn_dpnumberid: userNumberId,
      frn_dpaccountid: createdAccount.id,
      frn_dpcustomerid: userAsCustomer.id,
      voicemail_huntid: voiceMailHuntForUser.id
    });

    await assignPermissionToUser(
      createdUser.id,
      UserPermission.ACCOUNT_PRIMARY_USER
    );
    await assignPermissionToUser(
      createdUser.id,
      UserPermission.ACCOUNT_PRIMARY_BILLING
    );

    const forwardHuntForUser = await createHunt(createdAccount.id, {
      hunt_label: `${user.name_first} ${user.name_last} ${createdUser.id}`,
      frn_hunt_typeid: HuntType.USER_DIRECT
    });

    await updatePhoneNumber(userNumberId, createdAccount.id, {
      forward_huntid: forwardHuntForUser.id
    });

    await createHuntUserRelation(forwardHuntForUser.id, createdUser.id);
    await createHuntUserRelation(voiceMailHuntForUser.id, createdUser.id);

    await createRing({
      frn_dpuserid: createdUser.id,
      frn_ring_dpuser_typeid: RingUserType.WEB_RTC_CLIENT,
      ring_value: `client_${createdAccount.id}_${createdUser.id}`,
      ring_participate: RingParticipatePriority.HIGH
    });
    res
      .status(HttpStatus.CREATED)
      .json({ message: 'Account and user successfully created.' });
  } catch (err) {
    LOG.error('Create new account: %s', err.message);
    res.status(HttpStatus.BAD_REQUEST).json({ message: err.message });
  }
};

export const getAvailableNumbers = async (
  req: Request & { query: { areaCode: string } },
  res: Response
): Promise<void> => {
  const { areaCode } = req.query;
  const availablePhoneNumbers = await getAvailableNumbersByAreaCode(areaCode);
  res.json(availablePhoneNumbers);
};

export const getUserToken = async (
  req: Request & { query: { userId: string } },
  res: Response
): Promise<any> => {
  const { userId } = req.query;
  const user = await userService.getUserById(+userId);
  if (!user) {
    return res.status(HttpStatus.BAD_REQUEST).json({
      message: 'That user does not exist.'
    });
  }
  const token = generateToken({
    id: user.id,
    email: user.email,
    nameFirst: user.name_first,
    nameLast: user.name_last,
    accountId: user.frn_dpaccountid,
    numberId: user.number.id,
    userAsCustomerId: user.frn_dpcustomerid
  });
  res.json({ token });
};
