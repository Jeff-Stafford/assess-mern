import DPUserDevice from '../models/DPUserDevice';

export const deviceTokenCount = async (userId: number, deviceToken: string) =>
  DPUserDevice.count({
    where: {
      frn_dpuserid: userId,
      device_token: deviceToken
    }
  });

export const createDeviceToken = async (
  userId: number,
  deviceToken: string,
  providerId: number
) =>
  DPUserDevice.create({
    frn_dpuserid: userId,
    device_token: deviceToken,
    frn_device_providerid: providerId
  });

export const deleteDeviceToken = async (userId: number, deviceToken: string) =>
  DPUserDevice.destroy({
    where: {
      frn_dpuserid: userId,
      device_token: deviceToken
    }
  });
