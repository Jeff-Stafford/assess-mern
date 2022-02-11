import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { MobileRingChangeDays } from '../types';

export interface MobileRingChangeAttributes {
  id: number;
  change_dayofweek: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  change_hour: number;
  change_minute: number;
  change_value: boolean;
  frn_dpuserid: number;
  last_executed: string;
}

interface MobileRingChangeCreationAttributes
  extends Optional<MobileRingChangeAttributes, 'id'> {}

class MobileRingChange
  extends Model<MobileRingChangeAttributes, MobileRingChangeCreationAttributes>
  implements MobileRingChangeAttributes {
  public id!: number;
  change_dayofweek!: MobileRingChangeDays;
  change_hour!: number;
  change_minute!: number;
  change_value!: boolean;
  frn_dpuserid!: number;
  last_executed!: string;
}

MobileRingChange.init(
  {
    id: {
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
      type: new DataTypes.BIGINT()
    },
    change_dayofweek: {
      allowNull: false,
      type: new DataTypes.SMALLINT()
    },
    change_hour: {
      allowNull: false,
      type: new DataTypes.SMALLINT()
    },
    change_minute: {
      allowNull: false,
      type: new DataTypes.SMALLINT()
    },
    change_value: {
      allowNull: false,
      type: DataTypes.BOOLEAN
    },
    frn_dpuserid: {
      allowNull: false,
      type: new DataTypes.BIGINT()
    },
    last_executed: {
      allowNull: true,
      type: new DataTypes.STRING()
    }
  },
  {
    tableName: 'mobile_ring_change',
    sequelize
  }
);

export default MobileRingChange;
