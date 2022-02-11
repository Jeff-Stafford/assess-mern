import { DataTypes } from 'sequelize';
import sequelize from '../config/database';

const EmojiReaction = sequelize.define('emoji_react', {
  id: {
    autoIncrement: true,
    primaryKey: true,
    type: DataTypes.BIGINT
  },
  frn_dpuserid: {
    type: DataTypes.BIGINT
  },
  frn_emojiid: {
    type: DataTypes.BIGINT
  },
  frn_dpcustomer_noteid: {
    type: DataTypes.BIGINT
  },
  react_datetime: {
    type: DataTypes.DATE
  }
});

export default EmojiReaction;
