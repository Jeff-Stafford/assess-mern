import { Fn } from 'sequelize/types/lib/utils';
import { Socket } from 'socket.io';

export enum CustomerThreadReadStatus {
  UNREAD = 0,
  READ = 1,
  IGNORE = 2
}

export enum SocketEvent {
  NOTE_CREATED = 'note-created',
  NOTE_UPDATED = 'note-updated',
  NOTE_DELETED = 'note-deleted',
  USER_STATUS_DISPLAY_CHANGED = 'user-status-display-changed',
  USER_BASIC_DATA_CHANGED = 'user-basic-data-changed',
  EMOJI_REACTION = 'emoji-reaction',
  DEVICE_ACTIVE = 'device_activity',
  CALL_DETECTED = 'call-detected'
}

export enum UserPermission {
  ACCOUNT_PRIMARY_USER = 1,
  ACCOUNT_PRIMARY_BILLING = 2,
  CONFIGURE_NUMBERS = 3,
  CONFIGURE_USERS = 4,
  CALL_BARGE = 5,
  GENERAL_VOICEMAIL_MANAGER = 6
}

export enum RingUserType {
  WEB_RTC_CLIENT = 1,
  MOBILE_SIM = 2,
  MOBILE_FORWARD = 3,
  DID_FORWARD = 4
}

export enum NoteType {
  INCOMING_CALL = 1,
  OUTGOING_CALL = 2,
  INCOMING_TEXT = 3,
  OUTGOING_TEXT = 4,
  NOTE = 5,
  CRM_UPDATE = 6
}

export enum DPActivityType {
  LOGGED_IN = 1,
  AVAILABILITY_MANUALLY_UPDATED = 2,
  AVAILABILITY_AUTOMATICALLY_UPDATED = 3,
  REPORT_VIEWED = 4,
  NEW_NUMBER_PROVISIONED = 5,
  USER_DELETED = 6,
  ACTIVITY_CONTINUED = 7,
  INTERNAL_TESTING = 8,
  CUSTOMER_THREAD_OPENED = 9,
  CUSTOMER_DATA_UPDATED = 10,
  OWN_USER_DATA_UPDATED = 11,
  NOTE_INSERTED = 12,
  USER_CREATED = 13
}

export enum PhoneNumberType {
  MAIN_LINE = 1,
  INDIVIDUAL_USER = 2,
  INBOUND_DID = 3,
  OUTBOUND_CALLER_ID = 4
}

export enum HuntGreetingType {
  PRE_CALL_ANNOUNCEMENT = 1,
  BRIDGE_MENU = 2,
  VOICEMAIL_INDIVIDUAL = 3,
  VOICEMAIL_GENERAL = 4
}

export enum RequestParamIdPlaceholder {
  ID = 'id',
  USER_ID = 'userId',
  CUSTOMER_ID = 'customerId',
  EXTENSION_ID = 'extensionId',
  PERMISSION_ID = 'permissionId',
  FOLLOWING_USER_ID = 'followingUserId',
  EXTERNAL_DID_ID = 'externalDidId',
  NOTE_ID = 'noteId',
  EMOJI_ID = 'emojiId',
  CALL_ID = 'callId'
}

export enum HuntType {
  USER_DIRECT = 1,
  USER_MULTIPLE_ROUNDROBIN = 2,
  USER_MULTIPLE_SIMULTANEOUS = 3,
  BRIDGE = 4,
  VOICEMAIL = 5,
  RING_DID = 6,
  VOICEMAIL_GENERAL = 7
}

export enum RingParticipatePriority {
  NO_PRIORITY = 0,
  HIGH = 1,
  MEDIUM = 2
}

export enum EmojiReactionActionType {
  CREATE = 1,
  DELETE = 2,
  UPDATE = 3
}

export enum CallRecordingType {
  ALL_PARTIES_AUTOMATIC = 1,
  ALL_PARTIES_USER = 2,
  ALL_PARTIES_MANAGER = 3,
  ONE_PARTY_AUTOMATIC = 4,
  ONE_PARTY_USER = 5,
  ONE_PARTY_MANAGER = 6,
  VOICEMAIL = 7
}

export enum StatusDisplay {
  USER_LIKELY_AVAILABLE = 1,
  USER_IN_CALL = 2,
  USER_NOT_AVAILABLE = 3
}

export enum MobileRingChangeDays {
  SUNDAY = 1,
  MONDAY = 2,
  TUESDAY = 3,
  WEDNESDAY = 4,
  THURSDAY = 5,
  FRIDAY = 6,
  SATURDAY = 7
}

interface UserPayload {
  id: number;
  name_first: string;
  name_last: string;
  avatar: string;
}

export interface LatestCustomerNoteEventPayload {
  id: number;
  user: UserPayload;
  customer_id: number;
  datetime: string;
  last_update_action: string;
  note_comment: string;
  note_type: string;
  note_url: string | null;
  note_file: string | null;
  transaction_reference: number | null;
  show_details: string | null;
  note_image: string | null;
}

export interface UserStatusDisplayChangedEventPayload {
  user_id: number;
  status_display: StatusDisplay;
}

export interface UserBasicDataChangedEventPayload {
  user_id: number;
  name_first: string;
  name_last: string;
  cell_number: string;
  avatar: string;
}

export interface EmojiReactionEventPayload {
  thread_id: number;
  note_id: number;
  user_id: number;
  reaction_id: number;
  type: EmojiReactionActionType;
}

export interface CallEventPayload {
  user: {
    id: number;
    firstName: string;
    lastName: string;
  };
  call: {
    id: number;
    type: string;
  };
  customer: {
    id: number;
    name: string;
    number: string;
  };
}

export interface CustomerAndCallType {
  callType: string;
  customer: {
    id: number;
    name: string;
    number: string;
  };
}

export interface SocketAuth {
  token?: string;
}

export interface HuntGreeting {
  greeting_id?: number;
  greeting_label: string;
  greeting_tts: string;
  greeting_tts_voice: string;
  greeting_file: string;
  private_dpuserid?: number;
  frn_dpaccountid?: number;
  frn_hunt_greeting_typeid: number;
}

export interface Hunt {
  hunt_label: string;
  frn_hunt_typeid?: number;
  frn_hunt_greetingid?: number;
}

export interface PhoneNumber {
  number_label?: string;
  forward_huntid: number;
  fallback_huntid?: number;
}

export interface HuntExtension {
  frn_huntid: number;
  extension_digit: number;
  extension_label: string;
  forward_huntid: number;
}

export interface ExternalDid {
  frn_dpaccountid: number;
  did_label: string;
  did_value: string;
}

export interface Ring {
  frn_dpuserid?: number;
  frn_ring_dpuser_typeid?: number;
  ring_value: string;
  ring_participate?: number;
}

export interface RingRequestBody {
  user_id: number;
  ring_type_id: number;
  ring_value: string;
  ring_participate: number;
}

export interface MobileLoginVerificationRequest {
  phone_number: string;
  confirm_code: string;
}

export interface User {
  id?: number;
  frn_dpaccountid: number;
  avatar?: string;
  frn_dpnumberid: number;
  email: string;
  timezone_offset?: number;
  name_first: string;
  name_last: string;
  frn_dpcustomerid: number;
  voicemail_huntid: number;
}

export interface Customer {
  customer_number: string;
  customer_name: string;
  frn_dpaccountid: number;
  last_update?: Fn;
  last_update_action?: string;
  textable?: boolean;
}

export interface EmojiReactionPayload {
  frn_dpuserid: number;
  frn_emojiid: number;
  frn_dpcustomer_noteid: number;
}

export interface ThreadNote {
  id: number;
  datetime: string;
  note_comment: string;
  note_url: string | null;
  note_file: string | null;
  user_id: number;
  user_name_first: string;
  user_name_last: string;
  user_avatar: string;
  note_type_id: number;
  note_type_description: string;
  reactions: {
    user_id: number;
    reaction_id: number;
  }[];
}

export interface TokenPayload {
  id: number;
  accountId: number;
  numberId: number;
  email: string;
  nameFirst: string;
  nameLast: string;
  userAsCustomerId: number;
}

export interface ToneSocket extends Socket {
  accountId: number;
  userId: number;
}

export interface CallData {
  call: {
    start_datetime: string;
    call_duration_seconds: number;
    call_type: string;
    call_result: string;
  };
  users: {
    id: number;
    name_first: string;
    name_last: string;
    avatar: string;
  }[];
  customer: {
    id: number;
    customer_name: string;
    customer_number: string;
  };
  recordings: {
    recording_file: string;
  }[];
  transcriptions: {
    transcription_data: string;
  }[];
}

export interface UserVoicemail {
  first_viewed_at: string;
  call: {
    start_datetime: string;
    call_duration_seconds: number;
  };
  customer: {
    customer_name: string;
    customer_number: string;
  };
  recordings: {
    recording_url: string;
  }[];
  transcriptions: {
    transcription_data: string;
  }[];
}

export interface AccountWithUsersAndNumbersCount {
  id: number;
  account_name: string;
  account_logo: string;
  users_count: number;
  numbers_count: number;
}

export interface AccountWithUsersAndNumbers {
  id: number;
  account_name: string;
  account_logo: string;
  users: {
    id: number;
    name_first: string;
    name_last: string;
    avatar: string;
    email: string;
    number: {
      id: number;
      number_did: string;
      number_label: string;
    };
  }[];
  numbers: {
    id: number;
    number_did: string;
    number_label: string;
    type: {
      type_description: string;
    };
  }[];
}

export interface XConnect {
  id: number;
  connect_link: string;
  xconnect: {
    id: number;
    platform_name: string;
    display_image: string;
  };
}

export interface EventEmitter {
  emitLatestCustomerNoteEvent: (
    accountId: number,
    payload: LatestCustomerNoteEventPayload,
    eventType: string
  ) => void;
  emitLatestDeletedCustomerNoteEvent: (
    accountId: number,
    noteId: number,
    lastUpdateAction: string
  ) => void;
  emitUserStatusDisplayChangedEvent: (
    accountId: number,
    payload: UserStatusDisplayChangedEventPayload
  ) => void;
  emitUserBasicDataChangedEvent: (
    accountId: number,
    payload: UserBasicDataChangedEventPayload
  ) => void;
  emitEmojiReactionEvent: (
    accountId: number,
    payload: EmojiReactionEventPayload
  ) => void;
  emitCallEvent: (accountId: number, payload: CallEventPayload) => void;
  listenSocketRoom: () => void;
}
