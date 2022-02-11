import UserPerm from '../models/UserPerm';
import DPUser from '../models/DPUser';
import UserPermDPUser from '../models/UserPermDPUser';

export const findPermissions = (): Promise<any> =>
  UserPerm.findAll({ order: [['sort_order', 'ASC']] });

export const findPermissionsWithUsers = (accountId: number): Promise<any> =>
  UserPerm.findAll({
    include: [
      {
        model: UserPermDPUser,
        as: 'user_relations',
        attributes: {
          exclude: ['frn_userpermid', 'frn_dpuserid']
        },
        include: [
          {
            model: DPUser,
            as: 'user',
            attributes: ['id', 'name_first', 'name_last', 'avatar'],
            where: { frn_dpaccountid: accountId }
          }
        ]
      }
    ],
    order: [['sort_order', 'ASC']]
  });

export const findPermissionById = async (id: number): Promise<any> =>
  UserPerm.findByPk(id);

export const assignPermissionToUser = (
  userId: number,
  permissionId: number
): Promise<any> =>
  UserPermDPUser.create({
    frn_dpuserid: userId,
    frn_userpermid: permissionId
  });
