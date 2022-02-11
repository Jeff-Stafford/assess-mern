import { DataTypes } from 'sequelize';
import sequelize from '../config/database';

const HuntExtension = sequelize.define('hunt_extension', {
  id: {
    autoIncrement: true,
    primaryKey: true,
    type: DataTypes.BIGINT
  },
  frn_huntid: {
    type: DataTypes.BIGINT
  },
  extension_digit: {
    type: DataTypes.INTEGER,
    validate: {
      min: 0,
      max: 9
    }
  },
  extension_label: {
    type: DataTypes.STRING
  },
  forward_huntid: {
    type: DataTypes.BIGINT
  },
  extension_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
});

export default HuntExtension;
