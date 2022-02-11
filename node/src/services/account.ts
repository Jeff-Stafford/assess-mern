import Sequelize from 'sequelize';
import DPAccount from '../models/DPAccount';
import {
  AccountWithUsersAndNumbersCount,
  AccountWithUsersAndNumbers
} from '../types';
import DPUser from '../models/DPUser';
import DPNumber from '../models/DPNumber';
import DPNumberType from '../models/DPNumberType';

export const getAccountTimeZoneOffset = (accountId: number): Promise<any> =>
  DPAccount.findOne({
    attributes: ['timezone_offset_default'],
    where: {
      id: accountId
    }
  });

export const findActiveAccounts = async (): Promise<
  AccountWithUsersAndNumbersCount[]
> => {
  const accounts: any = await DPAccount.findAll({
    where: { account_active: true },
    attributes: {
      include: [
        'id',
        'account_name',
        'account_logo',
        [
          Sequelize.literal(`(
            SELECT COUNT(*)
            FROM dpuser AS user
            WHERE
              user.frn_dpaccountid = dpaccount.id
              AND
              user.user_active = 1
          )`),
          'users_count'
        ],
        [
          Sequelize.literal(`(
            SELECT COUNT(*)
            FROM dpnumber AS number
            WHERE
              number.frn_dpaccountid = dpaccount.id
              AND
              number.number_active = 1
          )`),
          'numbers_count'
        ]
      ]
    }
  });

  return accounts.map(
    ({
      dataValues: { id, account_name, account_logo, users_count, numbers_count }
    }: any) => ({
      id,
      account_name,
      account_logo,
      users_count,
      numbers_count
    })
  );
};

export const findActiveAccountById = async (
  accountId: number
): Promise<AccountWithUsersAndNumbers[]> => {
  const account: any = await DPAccount.findOne({
    where: { id: accountId, account_active: true },
    attributes: ['id', 'account_name', 'account_logo'],
    include: [
      {
        model: DPUser,
        as: 'users',
        where: { user_active: true },
        attributes: ['id', 'name_first', 'name_last', 'avatar', 'email'],
        include: [
          {
            model: DPNumber,
            as: 'number',
            attributes: ['id', 'number_did', 'number_label']
          }
        ],
        required: false
      },
      {
        model: DPNumber,
        as: 'numbers',
        where: { number_active: true },
        attributes: ['id', 'number_did', 'number_label'],
        include: [
          { model: DPNumberType, as: 'type', attributes: ['type_description'] }
        ],
        required: false
      }
    ]
  });

  return (
    account && {
      id: account.id,
      account_name: account.account_name,
      account_logo: account.account_logo,
      users: account.users,
      numbers: account.numbers
    }
  );
};

export const createAccount = (name: string, logo: string): Promise<any> =>
  DPAccount.create({ account_name: name, account_logo: logo });
