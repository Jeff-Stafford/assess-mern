import { DataTypes } from 'sequelize';
import sequelize from '../config/database';

const Emoji = sequelize.define('emoji', {
  id: {
    autoIncrement: true,
    primaryKey: true,
    type: DataTypes.BIGINT
  },
  emoji_name: {
    type: DataTypes.STRING
  },
  emoji_icon: {
    type: DataTypes.STRING
  },
  sort_order: {
    type: DataTypes.SMALLINT
  }
});

export default Emoji;
