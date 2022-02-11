import { DataTypes } from 'sequelize';
import sequelize from '../config/database';

const HuntDPUser = sequelize.define('hunt_dpuser', {
  id: {
    autoIncrement: true,
    primaryKey: true,
    type: DataTypes.BIGINT
  },
  frn_huntid: {
    type: DataTypes.BIGINT
  },
  frn_dpuserid: {
    type: DataTypes.BIGINT
  },
  hunt_dpuser_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
});

export default HuntDPUser;
