import MobileRingChange from '../models/MobileRingChange';

export const getMobileRingByUserId = async (userId: number) =>
  MobileRingChange.findAll({
    where: { frn_dpuserid: userId },
    raw: true
  });

export const removeMobileRingByUserId = async (userId: number) =>
  MobileRingChange.destroy({
    where: { frn_dpuserid: userId }
  });

export const createMobileRing = async (rows: any) =>
  MobileRingChange.bulkCreate(rows);
