import { Request, Response } from 'express';
import {
  findPermissions,
  findPermissionsWithUsers
} from '../services/permission';

export const getPermissions = async (
  { tokenPayload, query }: Request,
  res: Response
) => {
  const permissions = query.includeUsers
    ? await findPermissionsWithUsers(tokenPayload.accountId)
    : await findPermissions();
  res.json(permissions);
};
