import { DataTypes } from 'sequelize';
import sequelize from '../config/database';

const HuntRingDid = sequelize.define('hunt_ring_did', {
  id: {
    autoIncrement: true,
    primaryKey: true,
    type: DataTypes.BIGINT
  },
  frn_huntid: {
    type: DataTypes.BIGINT
  },
  frn_ring_didid: {
    type: DataTypes.BIGINT
  }
});

export default HuntRingDid;
