import { DataTypes } from 'sequelize';
import sequelize from '../config/database';

const Hunt = sequelize.define('hunt', {
  id: {
    autoIncrement: true,
    primaryKey: true,
    type: DataTypes.BIGINT
  },
  frn_dpaccountid: {
    type: DataTypes.BIGINT
  },
  hunt_label: {
    type: DataTypes.STRING
  },
  frn_hunt_typeid: {
    type: DataTypes.BIGINT
  },
  frn_hunt_greetingid: {
    type: DataTypes.BIGINT,
    allowNull: true
  },
  hunt_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
});

export default Hunt;
