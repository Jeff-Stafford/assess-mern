import { DataTypes } from 'sequelize';
import sequelize from '../config/database';

const HuntType = sequelize.define('hunt_type', {
  id: {
    autoIncrement: true,
    primaryKey: true,
    type: DataTypes.BIGINT
  },
  type_description: {
    type: DataTypes.STRING
  }
});

export default HuntType;
