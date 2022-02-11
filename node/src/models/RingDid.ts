import { DataTypes } from 'sequelize';
import sequelize from '../config/database';

const RingDid = sequelize.define('ring_did', {
  id: {
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
    type: DataTypes.BIGINT
  },
  frn_dpaccountid: {
    type: DataTypes.BIGINT
  },
  did_label: {
    type: DataTypes.STRING
  },
  did_value: {
    type: DataTypes.STRING
  }
});

export default RingDid;
