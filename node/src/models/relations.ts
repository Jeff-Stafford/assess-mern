import DPAccount from './DPAccount';
import DPUser from './DPUser';
import DPCustomer from './DPCustomer';
import DPNumber from './DPNumber';
import DPNumberType from './DPNumberType';
import DPHunt from './Hunt';
import DPHuntType from './HuntType';
import DPHuntGreeting from './HuntGreeting';
import DPHuntExtension from './HuntExtension';
import DPHuntDPUser from './HuntDPUser';
import HuntRingDid from './HuntRingDid';
import RingDid from './RingDid';
import DPCustomerNote from './DPCustomerNote';
import DPCustomerNoteType from './DPCustomerNoteType';
import UserPermDPUser from './UserPermDPUser';
import UserPerm from './UserPerm';
import UserFollow from './UserFollow';
import RingDPUser from './RingDPUser';
import RingDPUserType from './RingDPUserType';
import DPActivity from './DPActivity';
import Emoji from './Emoji';
import EmojiReaction from './EmojiReaction';
import DPCall from './DPCall';
import DPCallType from './DPCallType';
import DPCallResult from './DPCallResult';
import DPCallDPUser from './DPCallDPUser';
import DPCallRecording from './DPCallRecording';
import DPCallTranscription from './DPCallTranscription';

export default () => {
  DPUser.belongsTo(DPNumber, { foreignKey: 'frn_dpnumberid', as: 'number' });
  DPUser.belongsTo(DPAccount, { foreignKey: 'frn_dpaccountid', as: 'account' });
  DPUser.hasMany(DPActivity, { foreignKey: 'frn_dpuserid', as: 'activities' });
  DPUser.belongsTo(DPHunt, {
    foreignKey: 'voicemail_huntid',
    as: 'hunt'
  });
  DPHunt.belongsTo(DPHuntType, { foreignKey: 'frn_hunt_typeid', as: 'type' });
  DPHunt.belongsTo(DPHuntGreeting, {
    foreignKey: 'frn_hunt_greetingid',
    as: 'greeting'
  });
  DPHuntGreeting.hasMany(DPHunt, {
    foreignKey: 'frn_hunt_greetingid',
    as: 'hunts'
  });
  DPHunt.hasMany(DPHuntExtension, {
    foreignKey: 'frn_huntid',
    as: 'extensions'
  });
  DPHunt.hasMany(DPHuntDPUser, {
    foreignKey: 'frn_huntid',
    as: 'users'
  });
  DPHuntExtension.belongsTo(DPHunt, {
    foreignKey: 'forward_huntid',
    as: 'forward_hunt'
  });
  DPHuntExtension.belongsTo(DPHunt, {
    foreignKey: 'fallback_huntid',
    as: 'fallback_hunt'
  });
  DPNumber.belongsTo(DPNumberType, {
    foreignKey: 'frn_dpnumber_typeid',
    as: 'type'
  });
  DPNumber.belongsTo(DPHunt, {
    foreignKey: 'forward_huntid',
    as: 'forward_hunt'
  });
  DPNumber.belongsTo(DPHunt, {
    foreignKey: 'fallback_huntid',
    as: 'fallback_hunt'
  });
  DPHuntDPUser.belongsTo(DPHunt, { foreignKey: 'frn_huntid', as: 'hunt' });
  DPHuntDPUser.belongsTo(DPUser, { foreignKey: 'frn_dpuserid', as: 'user' });
  HuntRingDid.belongsTo(DPHunt, { foreignKey: 'frn_huntid', as: 'hunt' });
  HuntRingDid.belongsTo(RingDid, {
    foreignKey: 'frn_ring_didid',
    as: 'ring_did'
  });
  DPCustomerNote.belongsTo(DPCustomerNoteType, {
    foreignKey: 'frn_dpcustomer_note_typeid',
    as: 'type'
  });
  DPCustomerNote.belongsTo(DPCustomer, {
    foreignKey: 'frn_dpcustomerid',
    as: 'customer'
  });
  DPCustomerNote.belongsTo(DPUser, {
    foreignKey: 'frn_dpuserid',
    as: 'user'
  });
  DPCustomerNote.hasMany(EmojiReaction, {
    foreignKey: 'frn_dpcustomer_noteid',
    as: 'reactions'
  });
  UserPermDPUser.belongsTo(UserPerm, {
    foreignKey: 'frn_userpermid',
    as: 'permission'
  });
  DPUser.hasMany(UserPermDPUser, {
    foreignKey: 'frn_dpuserid',
    as: 'permissions'
  });
  UserPerm.hasMany(UserPermDPUser, {
    foreignKey: 'frn_userpermid',
    as: 'user_relations'
  });
  UserPermDPUser.belongsTo(DPUser, {
    foreignKey: 'frn_dpuserid',
    as: 'user'
  });
  UserFollow.belongsTo(DPUser, {
    foreignKey: 'following_frn_dpuserid',
    as: 'following_user'
  });
  RingDPUser.belongsTo(DPUser, {
    foreignKey: 'frn_dpuserid',
    as: 'user'
  });
  RingDPUser.belongsTo(RingDPUserType, {
    foreignKey: 'frn_ring_dpuser_typeid',
    as: 'type'
  });
  EmojiReaction.belongsTo(Emoji, {
    foreignKey: 'frn_emojiid',
    as: 'emoji'
  });
  DPCall.belongsTo(DPCallType, {
    foreignKey: 'frn_dpcall_typeid',
    as: 'type'
  });
  DPCall.belongsTo(DPCallResult, {
    foreignKey: 'frn_dpcall_resultid',
    as: 'result'
  });
  DPCall.belongsTo(DPCustomer, {
    foreignKey: 'frn_dpcustomerid',
    as: 'customer'
  });
  DPCall.hasMany(DPCallDPUser, {
    foreignKey: 'frn_dpcallid',
    as: 'users'
  });
  DPCall.hasMany(DPCallRecording, {
    foreignKey: 'frn_dpcallid',
    as: 'recordings'
  });
  DPCall.hasMany(DPCallTranscription, {
    foreignKey: 'frn_dpcallid',
    as: 'transcriptions'
  });
  DPCallDPUser.belongsTo(DPUser, {
    foreignKey: 'frn_dpuserid',
    as: 'user'
  });
};
