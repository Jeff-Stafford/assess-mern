import { DataTypes } from 'sequelize';
import sequelize from '../config/database';

const HuntGreeting = sequelize.define('hunt_greeting', {
  id: {
    autoIncrement: true,
    primaryKey: true,
    type: DataTypes.BIGINT
  },
  frn_dpaccountid: {
    type: DataTypes.BIGINT
  },
  greeting_label: {
    type: DataTypes.STRING
  },
  greeting_file: {
    type: DataTypes.STRING
  },
  greeting_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  greeting_tts: {
    type: DataTypes.STRING
  },
  greeting_tts_voice: {
    type: DataTypes.STRING
  },
  private_dpuserid: {
    type: DataTypes.BIGINT
  },
  frn_hunt_greeting_typeid: {
    type: DataTypes.BIGINT
  }
});

export default HuntGreeting;
