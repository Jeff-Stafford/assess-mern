import { Request, Response } from 'express';
import HttpStatus from 'http-status-codes';
import * as userService from '../services/user';
import { findPermissionById } from '../services/permission';
import { createCustomer, getCustomerById } from '../services/customer';
import { getAccountTimeZoneOffset } from '../services/account';
import {
  deleteRemoteFile,
  huntGreetingFileUploader,
  userAvatarFileUploader
} from '../helpers/file-manager';
import {
  DEFAULT_HUNT_GREETING_ID,
  STATIC_CONTENT_BASE_URL
} from '../config/constants';
import {
  CustomerThreadReadStatus,
  DPActivityType,
  HuntGreeting,
  HuntGreetingType,
  HuntType,
  PhoneNumberType,
  RingParticipatePriority,
  RingUserType
} from '../types';
import { provisionNumber } from '../helpers/twilio';
import { getLogger } from '../helpers/logger';
import { createHunt, createHuntUserRelation } from '../services/hunt';
import { updatePhoneNumber } from '../services/phone-number';
import { createRing, updateRing } from '../services/ring';
import trackActivity from '../helpers/activity-tracker';
import { createHuntGreeting } from '../services/hunt-greeting';

const LOG = getLogger('user-controller');

export const getAllUsersByAccount = async (
  { tokenPayload: { accountId } }: Request,
  res: Response
) => {
  try {
    const users = await userService.getUsersByAccountId(accountId);
    res.json(
      users.map(({ dataValues: { activities, ...restOfUser } }: any) => ({
        ...restOfUser,
        last_activity: activities[0]?.activity_datetime || null
      }))
    );
  } catch (error) {
    LOG.error('Get all users by account: %s', error.message);
    res
      .status(HttpStatus.BAD_REQUEST)
      .json({ message: 'Something is wrong. Please try again.' });
  }
};

export const getLoggedInUser = async (
  { tokenPayload: { id: userId } }: Request,
  res: Response
) => {
  try {
    const user = await _findUserById(userId);
    if (!user) {
      return res.status(HttpStatus.NOT_FOUND).end();
    }
    res.json(user.dataValues);
  } catch (error) {
    LOG.error('Get logged in user: %s', error.message);
    res
      .status(HttpStatus.BAD_REQUEST)
      .json({ message: 'Something is wrong. Please try again.' });
  }
};

export const getUser = async (req: Request, res: Response): Promise<any> => {
  const { userId } = req.params;

  try {
    const user = await _findUserById(+userId);
    if (!user) {
      return res.status(HttpStatus.NOT_FOUND).end();
    }
    res.json(user);
  } catch (error) {
    LOG.error('Get user: %s', error.message);
    res
      .status(HttpStatus.BAD_REQUEST)
      .json({ message: 'Something is wrong. PLease try again.' });
  }
};

const _findUserById = (userId: number) => userService.getUserById(userId);

export const createUser = async (
  { tokenPayload, body }: Request,
  res: Response
): Promise<any> => {
  const { name_first, name_last, email, number_did, number_label } = body;
  const { accountId, id: requestUserId } = tokenPayload;
  try {
    const createdPhoneNumberId = await provisionNumber(
      number_did,
      number_label,
      accountId,
      PhoneNumberType.INDIVIDUAL_USER
    );

    trackActivity(
      DPActivityType.NEW_NUMBER_PROVISIONED,
      'New number provisioned while creating a new user',
      requestUserId
    );

    const userAsCustomer = await createCustomer({
      customer_number: number_did,
      customer_name: `${name_first} ${name_last}`,
      frn_dpaccountid: accountId,
      textable: true
    });

    const voiceMailHuntForUser = await createHunt(accountId, {
      hunt_label: `${name_first} ${name_last} Voicemail`,
      frn_hunt_typeid: HuntType.VOICEMAIL,
      frn_hunt_greetingid: DEFAULT_HUNT_GREETING_ID
    });

    const {
      timezone_offset_default: timezone_offset
    } = await getAccountTimeZoneOffset(accountId);

    const createdUser = await userService.createUser({
      name_first,
      name_last,
      timezone_offset,
      email,
      frn_dpnumberid: createdPhoneNumberId,
      frn_dpaccountid: accountId,
      frn_dpcustomerid: userAsCustomer.id,
      voicemail_huntid: voiceMailHuntForUser.id
    });

    trackActivity(
      DPActivityType.USER_CREATED,
      `New user created with id ${createdUser.id}`,
      requestUserId
    );

    const forwardHuntForUser = await createHunt(accountId, {
      hunt_label: `${name_first} ${name_last} ${createdUser.id}`,
      frn_hunt_typeid: HuntType.USER_DIRECT
    });

    await updatePhoneNumber(createdPhoneNumberId, accountId, {
      forward_huntid: forwardHuntForUser.id
    });

    await createHuntUserRelation(forwardHuntForUser.id, createdUser.id);
    await createHuntUserRelation(voiceMailHuntForUser.id, createdUser.id);

    await createRing({
      frn_dpuserid: createdUser.id,
      frn_ring_dpuser_typeid: RingUserType.WEB_RTC_CLIENT,
      ring_value: `client_${accountId}_${createdUser.id}`,
      ring_participate: RingParticipatePriority.HIGH
    });

    res.status(HttpStatus.CREATED).json(createdUser);
  } catch (error) {
    LOG.error('Create a user: %s', error.message);
    if (error.message === 'twilio-error') {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json({ message: 'Could not provision the number on Twilio side.' });
    }
    res
      .status(HttpStatus.BAD_REQUEST)
      .json({ message: 'Could not create the user. Try again later.' });
  }
};

export const checkEmailAvailability = async (
  req: Request & { query: { email: string } },
  res: Response
) => {
  const { email } = req.query;
  try {
    if (!email) {
      throw new Error('Email is required to check for.');
    }
    const userByEmail = await userService.findUserByEmail(email);
    res.json({ available: !userByEmail });
  } catch (error) {
    LOG.error('Check email availability: %s', error.message);
    res.status(HttpStatus.BAD_REQUEST).json({
      message: 'Could not check for email availability. Try again later.'
    });
  }
};

export const changeUserBasicData = async (
  { tokenPayload, body, params, app }: Request,
  res: Response
): Promise<any> => {
  const { name_first, name_last, email, cell_number } = body;
  const { accountId, id: requestUserId } = tokenPayload;
  const { userId } = params;

  if (!name_first || !name_last || !email || !cell_number) {
    return res.status(HttpStatus.BAD_REQUEST).json({
      message:
        'The first name, last name, cell phone number or email should not be empty.'
    });
  }

  try {
    const user = await userService.getUserById(+userId);
    await userService.updateUser(+userId, accountId, {
      name_first,
      name_last,
      email,
      cell_number
    });
    app.get('socketEventEmitter').emitUserBasicDataChangedEvent(accountId, {
      user_id: +userId,
      name_first,
      email,
      name_last,
      cell_number,
      avatar: user.avatar
    });

    if (+userId === requestUserId) {
      trackActivity(
        DPActivityType.OWN_USER_DATA_UPDATED,
        'User changed their own basic data',
        requestUserId
      );
    }

    res.json({ message: 'User basic data changed.' });
  } catch (error) {
    LOG.error('Change user basic data: %s', error.message);
    res
      .status(HttpStatus.BAD_REQUEST)
      .json({ message: 'User basic data not changed. Something is wrong.' });
  }
};

export const deactivateUser = async (
  { tokenPayload, params }: Request,
  res: Response
): Promise<any> => {
  const { userId } = params;
  const { accountId, id: requestUserId } = tokenPayload;

  try {
    await userService.updateUser(+userId, accountId, { user_active: false });

    trackActivity(
      DPActivityType.USER_DELETED,
      `User ${userId} deactivated`,
      requestUserId
    );

    res.json({ message: 'User deactivated.' });
  } catch (error) {
    LOG.error('Deactivate user: %s', error.message);
    res
      .status(HttpStatus.BAD_REQUEST)
      .json({ message: 'User not deactivated. Something is wrong.' });
  }
};

const _uploadSingleFile = userAvatarFileUploader('image');

export const changeUserAvatar = async (
  req: Request & { file: any },
  res: Response
): Promise<any> => {
  const { userId } = req.params;
  const { id: tokenUserId, accountId } = req.tokenPayload;

  _uploadSingleFile(req, res, async (err: any) => {
    if (err) {
      LOG.error(
        'Upload single file while changing user avatar: %s',
        err.message
      );
      return res
        .status(HttpStatus.UNPROCESSABLE_ENTITY)
        .json({ message: 'Unable to upload the image.' });
    }

    if (!req.file) {
      return res
        .status(HttpStatus.UNPROCESSABLE_ENTITY)
        .json({ message: 'Please provide an image for avatar.' });
    }

    const { key } = req.file;

    const uploadedAvatar = `${STATIC_CONTENT_BASE_URL}/${key}`;
    const { avatar: currentAvatar } = await userService.getUserById(
      tokenUserId
    );

    await userService.updateUser(+userId, accountId, {
      avatar: uploadedAvatar
    });

    try {
      deleteRemoteFile(currentAvatar);
    } catch (error) {
      LOG.error('Unable to delete avatar from S3: %s', error.message);
    }

    res.json({ message: 'Image uploaded', avatar: uploadedAvatar });
  });
};

export const getCustomerThreads = async (
  req: Request & { query: { q: string; page: number; pageSize: number } },
  res: Response
) => {
  const { userId } = req.params;
  const { q = '', page = 1, pageSize = 100 } = req.query;
  const { userAsCustomerId, accountId } = req.tokenPayload;
  try {
    const offset = (page - 1) * pageSize;
    const customerThreads = await userService.getCustomerThreads(
      accountId,
      +userId,
      userAsCustomerId,
      q,
      offset,
      +pageSize
    );
    res.json(customerThreads);
  } catch (error) {
    LOG.error('Get customer threads for user [%d]: %s', userId, error.message);
    res
      .status(HttpStatus.BAD_REQUEST)
      .json({ message: 'Could not fetch customer threads. Try again later.' });
  }
};

export const getCustomerThread = async (
  { tokenPayload, params, pagination }: Request,
  res: Response
) => {
  const { userId, customerId } = params;
  const { id: requestUserId } = tokenPayload;
  try {
    const customerAndNotesPromises = [];
    customerAndNotesPromises.push(getCustomerById(+customerId));
    customerAndNotesPromises.push(
      userService.getCustomerNotes(
        +customerId,
        +userId,
        pagination?.page,
        pagination?.limit
      )
    );

    const customerAndNotes = await Promise.all(customerAndNotesPromises);

    const {
      id: customer_id,
      customer_number: customerNumber,
      customer_name: customerName,
      last_update: customerLastUpdate,
      textable: customerTextable
    } = customerAndNotes[0];

    const userAndCustomerReadStatusRow = await userService.getCustomerThreadReadStatus(
      +userId,
      +customerId
    );

    if (userAndCustomerReadStatusRow) {
      if (
        userAndCustomerReadStatusRow.read_status ===
        CustomerThreadReadStatus.UNREAD
      ) {
        userService.changeCustomerReadStatus(
          +userId,
          +customerId,
          CustomerThreadReadStatus.READ
        );
      }
    }

    trackActivity(
      DPActivityType.CUSTOMER_THREAD_OPENED,
      `Customer thread between user ${userId} and customer ${customerId} opened`,
      requestUserId
    );

    res.json({
      customer: {
        id: customer_id,
        number: customerNumber,
        name: customerName,
        last_update: customerLastUpdate,
        textable: customerTextable
      },
      data: customerAndNotes[1]
    });
  } catch (error) {
    LOG.error(
      'Get customer thread for user [%d] and customer [%d]: %s',
      userId,
      customerId,
      error.message
    );
    res
      .status(HttpStatus.BAD_REQUEST)
      .json({ message: 'Could not fetch customer thread. Try again later.' });
  }
};

export const getUserTeamMembers = async (
  { tokenPayload, params, query }: Request & { query: { q: string } },
  res: Response
) => {
  const { userId } = params;
  const { accountId } = tokenPayload;
  const { q } = query;
  try {
    const teamMembers = await userService.getTeamMembersForUserByAccountId(
      +accountId,
      +userId,
      q
    );

    res.json(teamMembers);
  } catch (error) {
    LOG.error('Fetch team members for user [%d]: %s', userId, error.message);
    res
      .status(HttpStatus.BAD_REQUEST)
      .json({ message: 'Could not fetch team members. Try again later.' });
  }
};

export const subscribeToCustomer = async (req: Request, res: Response) => {
  const { userId, customerId } = req.params;
  try {
    await userService.subscribeToCustomer(+userId, +customerId);
    res
      .status(HttpStatus.CREATED)
      .json({ message: 'Subscribed to customer.', customer_id: customerId });
  } catch (error) {
    LOG.error(
      'Subscribe user [%d] to customer [%d]: %s',
      userId,
      customerId,
      error.message
    );
    res.status(HttpStatus.BAD_REQUEST).json({
      message: `Unable to subscribe to customer [${customerId}]. Try again later.`
    });
  }
};

const _isReadStatusAllowed = (readStatus: number) =>
  readStatus === CustomerThreadReadStatus.IGNORE ||
  readStatus === CustomerThreadReadStatus.READ ||
  readStatus === CustomerThreadReadStatus.UNREAD;

export const changeCustomerReadStatus = async (req: Request, res: Response) => {
  const { userId, customerId } = req.params;
  const { read_status } = req.body;
  if (!_isReadStatusAllowed(read_status)) {
    return res
      .status(HttpStatus.BAD_REQUEST)
      .json({ message: `Read status [${read_status}] is not allowed.` });
  }
  try {
    await userService.changeCustomerReadStatus(
      +userId,
      +customerId,
      read_status
    );
    res.json({ message: 'Read status changed.' });
  } catch (error) {
    LOG.error(
      'User [%d] unable to change read status for customer [%d]: %s',
      userId,
      customerId,
      error.message
    );
    res.status(HttpStatus.BAD_REQUEST).json({
      message: `Unable to change read status for customer [${customerId}]. Try again later.`
    });
  }
};

export const getHunts = async (req: Request, res: Response) => {
  const { userId } = req.params;
  const userHunts = await userService.findHuntsByUserId(+userId);
  const mappedUserHunts = userHunts.map(({ hunt }: any) => hunt);

  res.json(mappedUserHunts);
};

export const getPermissionsByUser = async (req: Request, res: Response) => {
  const { userId } = req.params;
  const userWithPermissions = await userService.findUserAndPermissionsByUserId(
    +userId
  );
  if (!userWithPermissions) {
    return res.status(HttpStatus.NOT_FOUND).end();
  }
  const {
    id,
    name_first,
    name_last,
    avatar,
    permissions
  } = userWithPermissions;
  try {
    const response = {
      user: {
        id,
        name_first,
        name_last,
        avatar
      },
      permissions: permissions.map(
        ({ permission: { id, permission_description } }: any) => ({
          id,
          permission_description
        })
      )
    };
    res.json(response);
  } catch (error) {
    LOG.error('Get user [%d] with permissions: %s', userId, error.message);
    res
      .status(HttpStatus.BAD_REQUEST)
      .json({ message: 'Could not find the user with permissions.' });
  }
};

export const assignPermissionToUser = async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { permissionId } = req.body;
  try {
    const existingPermission = await userService.findPermissionByUserIdAndPermissionId(
      +userId,
      permissionId
    );
    if (existingPermission) {
      return res
        .status(HttpStatus.CONFLICT)
        .json({ message: 'User already has that permission.' });
    }

    const isPermissionAssignable = await _isPermissionEditable(permissionId);
    if (!isPermissionAssignable) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json({ message: 'This permission is not assignable.' });
    }

    await userService.assignPermissionToUser(+userId, permissionId);
    res.status(HttpStatus.CREATED).json({
      message: `Permission ${permissionId} assigned to user ${userId}.`
    });
  } catch (error) {
    LOG.error(
      'Assign permission [%d] to user [%d]. %s',
      permissionId,
      userId,
      error.message
    );
    res.status(HttpStatus.BAD_REQUEST).json({
      message: 'Could not assign the permission. Please try again later.'
    });
  }
};

export const removePermissionFromUser = async (req: Request, res: Response) => {
  const { userId, permissionId } = req.params;
  try {
    const isPermissionRemovable = await _isPermissionEditable(+permissionId);
    if (!isPermissionRemovable) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json({ message: 'This permission is not removable.' });
    }

    await userService.removePermissionFromUser(+userId, +permissionId);
    res.json({
      message: `Permission ${permissionId} removed from user ${userId}.`
    });
  } catch (error) {
    LOG.error(
      'Remove permission [%d] from user [%d]: %s',
      permissionId,
      userId,
      error.message
    );
    res.status(HttpStatus.BAD_REQUEST).json({
      message: 'Could not remove the permission. Please try again later.'
    });
  }
};

const _isPermissionEditable = async (
  permissionId: number
): Promise<boolean> => {
  const permission = await findPermissionById(permissionId);
  return permission && permission.allow_edit;
};

export const getUserFollowsWithOtherUsers = async (
  { tokenPayload: { accountId }, params: { userId } }: Request,
  res: Response
) => {
  const userFollowIds = [+userId];
  try {
    const { id, name_first, name_last, avatar } = await userService.getUserById(
      +userId
    );
    const follows = await userService.findUserFollows(+userId);
    const userFollows = follows.map(
      ({ following_user: { id, name_first, name_last, avatar } }: any) => {
        userFollowIds.push(id);
        return { id, name_first, name_last, avatar, following: true };
      }
    );
    const nonFollows = await userService.findUserNonFollows(
      accountId,
      userFollowIds
    );
    const userNonFollows = nonFollows.map((user: any) => ({
      ...user.dataValues,
      following: false
    }));
    res.json({
      user: {
        id,
        name_first,
        name_last,
        avatar
      },
      follows: [...userFollows, ...userNonFollows]
    });
  } catch (error) {
    LOG.error('Get user follows: %s', error.message);
    res
      .status(HttpStatus.BAD_REQUEST)
      .json({ message: 'Could not get the user follows.' });
  }
};

export const followUser = async (
  {
    tokenPayload: { accountId },
    body: { following_user_id },
    params: { userId }
  }: Request,
  res: Response
) => {
  try {
    const followingUser = await userService.findByUserIdAndAccountId(
      following_user_id,
      accountId
    );
    if (!followingUser) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: `User ${following_user_id} does not exist or does not belong to the same account.`
      });
    }
    await userService.followUser(+userId, followingUser.id);

    res
      .status(HttpStatus.CREATED)
      .json({ message: 'Started following the user.' });
  } catch (error) {
    LOG.error(
      'User [%d] could not start following user [%d]: %s',
      userId,
      following_user_id,
      error.message
    );
    res
      .status(HttpStatus.BAD_REQUEST)
      .json({ message: 'Could not start following the user.' });
  }
};

export const unFollowUser = async (req: Request, res: Response) => {
  const { userId, followingUserId } = req.params;
  try {
    await userService.unFollowUser(+userId, +followingUserId);
    res.json({ message: 'Stopped following the user.' });
  } catch (error) {
    LOG.error(
      'User [%d] could not stop following user [%d]: %s',
      userId,
      followingUserId,
      error.message
    );
    res
      .status(HttpStatus.BAD_REQUEST)
      .json({ message: 'Could not stop following the user.' });
  }
};

export const getUserCellPhone = async (req: Request, res: Response) => {
  const { userId } = req.params;
  try {
    const user = await userService.getUserById(+userId);
    res.json({ cell_phone_number: user.cell_number });
  } catch (error) {
    LOG.error(
      'Could not find cell phone for user [%d]: %s',
      userId,
      error.message
    );
    res
      .status(HttpStatus.BAD_REQUEST)
      .json({ message: 'Could not find cell phone for user.' });
  }
};

export const createOrUpdateUserCellPhone = async (
  req: Request,
  res: Response
) => {
  const { userId } = req.params;
  const { tokenPayload } = req;
  const { cell_phone_number } = req.body;
  try {
    await userService.updateUser(+userId, tokenPayload.accountId, {
      cell_number: cell_phone_number
    });
    res.json({ message: 'Cell phone updated.' });
  } catch (error) {
    LOG.error(
      'Could create nor update cell phone for user [%d]: %s',
      userId,
      error.message
    );
    res
      .status(HttpStatus.BAD_REQUEST)
      .json({ message: 'Could not create nor update cell phone for user.' });
  }
};

export const getUserVoicemailGreetings = async (
  req: Request,
  res: Response
) => {
  const { userId } = req.params;
  const { accountId } = req.tokenPayload;
  const userGreetings = await userService.findVoicemailGreetingsByUserId(
    accountId,
    +userId
  );
  const globalGreetings: HuntGreeting[] = [];
  const accountGreetings: HuntGreeting[] = [];
  const privateGreetings: HuntGreeting[] = [];
  userGreetings.forEach((userGreeting: HuntGreeting) => {
    if (userGreeting.greeting_id === DEFAULT_HUNT_GREETING_ID) {
      globalGreetings.push(userGreeting);
    } else if (userGreeting.private_dpuserid === +userId) {
      privateGreetings.push(userGreeting);
    } else if (userGreeting.frn_dpaccountid === accountId) {
      accountGreetings.push(userGreeting);
    }
  });
  res.json([...globalGreetings, ...accountGreetings, ...privateGreetings]);
};

export const getUserVoicemailGreeting = async (req: Request, res: Response) => {
  const { userId } = req.params;
  const userWithHuntGreeting = await userService.findVoicemailGreetingByUserId(
    +userId
  );
  if (!userWithHuntGreeting?.hunt?.greeting) {
    return res.status(HttpStatus.NOT_FOUND).end();
  }
  res.json(userWithHuntGreeting.hunt.greeting);
};

export const changeUserVoicemailGreeting = async (
  req: Request,
  res: Response
) => {
  const {
    tokenPayload,
    body: { greeting_id },
    params: { userId }
  } = req;
  try {
    const user = await userService.findByUserIdAndAccountId(
      +userId,
      tokenPayload.accountId
    );
    const userWithHuntGreeting = await userService.updateUserVoicemailGreeting(
      user.voicemail_huntid,
      greeting_id
    );
    res.json(userWithHuntGreeting);
  } catch (error) {
    LOG.error(
      'Change user %s voicemail greeting %s: %s',
      userId,
      greeting_id,
      error.message
    );
    res.status(HttpStatus.BAD_REQUEST).json({
      message: 'Unable to update user voicemail greeting. Tray again later.'
    });
  }
};

const _uploadGreetingFile = huntGreetingFileUploader('greeting_file');
const _prepareHuntGreetingForCreateOrUpdate = (
  req: Request & { file: any },
  userId: number
): HuntGreeting => {
  return {
    greeting_label: req.body.greeting_label,
    greeting_tts: req.body.greeting_tts,
    greeting_tts_voice: req.body.greeting_tts_voice,
    greeting_file: req.file && `${STATIC_CONTENT_BASE_URL}/${req.file.key}`,
    private_dpuserid: userId,
    frn_hunt_greeting_typeid: HuntGreetingType.VOICEMAIL_INDIVIDUAL
  };
};

export const createUserVoicemailGreeting = async (
  req: Request & { file: any },
  res: Response
) => {
  const { accountId } = req.tokenPayload;
  const { userId } = req.params;
  _uploadGreetingFile(req, res, async (err: any) => {
    if (err) {
      LOG.error('Upload single file while creating greeting: %s', err.message);
      return res
        .status(HttpStatus.UNPROCESSABLE_ENTITY)
        .json({ message: 'Unable to upload the hunt greeting file.' });
    }
    const huntGreeting = _prepareHuntGreetingForCreateOrUpdate(req, +userId);
    try {
      const createdHuntGreeting = await createHuntGreeting(
        accountId,
        huntGreeting
      );

      res.status(HttpStatus.CREATED).json(createdHuntGreeting);
    } catch (err) {
      LOG.error('Create Hunt Greeting: %s', err.message);
      res.status(HttpStatus.BAD_REQUEST).json({
        message: 'Could not create greeting. Please try again later.'
      });
    }
  });
};

export const getUserVoicemails = async (req: Request, res: Response) => {
  const { userId } = req.params;
  try {
    const userVoicemails = await userService.findVoicemailsByUserId(+userId);
    res.json(userVoicemails);
  } catch (err) {
    LOG.error('Get user voicemails: %s', err.message);
    res.status(HttpStatus.BAD_REQUEST).json({
      message: 'Could not get user voicemails. Please try again later.'
    });
  }
};

export const readUserVoicemail = async (req: Request, res: Response) => {
  const { userId, callId } = req.params;
  try {
    await userService.readUserVoicemailForFirstTime(+userId, +callId);
    res.end();
  } catch (err) {
    LOG.error('Read user voicemail: %s', err.message);
    res.status(HttpStatus.BAD_REQUEST).json({
      message: 'Could not read user voicemail. Please try again later.'
    });
  }
};
