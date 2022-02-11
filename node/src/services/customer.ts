import { Op } from 'sequelize';
import DPCustomerNote from '../models/DPCustomerNote';
import DPCustomerNoteType from '../models/DPCustomerNoteType';
import DPCustomer from '../models/DPCustomer';
import DPUser from '../models/DPUser';
import DPCustomerDPUser from '../models/DPCustomerDPUser';
import { Customer, CustomerThreadReadStatus, XConnect } from '../types';
import { generateMySqlNOWFunction } from '../utils';
import XConnectDPCustomer from '../models/XConnectDPCustomer';
import XConnectModel from '../models/XConnect';

export const getCustomerById = (id: number): Promise<any> =>
  DPCustomer.findByPk(id);

export const findAccountByCustomerId = (customerId: number): Promise<any> =>
  DPCustomer.findOne({
    where: { id: customerId },
    attributes: ['frn_dpaccountid']
  });

export const findCustomerByIdAndAccountId = async (
  customerId: number,
  accountId: number
): Promise<any> =>
  DPCustomer.findOne({
    where: {
      id: customerId,
      frn_dpaccountid: accountId
    }
  });

export const createCustomerNote = async (
  customerId: number,
  userId: number,
  noteComment: string,
  noteTypeId: number
): Promise<any> =>
  DPCustomerNote.create({
    frn_dpcustomerid: customerId,
    frn_dpuserid: userId,
    note_datetime: generateMySqlNOWFunction(),
    note_comment: noteComment,
    frn_dpcustomer_note_typeid: noteTypeId
  });

export const updateCustomerByIdAndAccountId = (
  customerId: number,
  accountId: number,
  payload: any
): Promise<any> =>
  DPCustomer.update(payload, {
    where: { id: customerId, frn_dpaccountid: accountId }
  });

export const updateCustomerByAccountIdAndCustomerNumber = (
  accountId: number,
  customerNumber: string,
  payload: any
): Promise<any> =>
  DPCustomer.update(payload, {
    where: { frn_dpaccountid: accountId, customer_number: customerNumber }
  });

export const createCustomer = (payload: Customer): Promise<any> =>
  DPCustomer.create(payload);

export const findCustomerByPhoneNumber = (
  phoneNumber: string,
  accountId: number
): Promise<any> =>
  DPCustomer.findOne({
    where: {
      [Op.and]: [
        { frn_dpaccountid: { [Op.eq]: accountId } },
        { customer_number: { [Op.eq]: phoneNumber } }
      ]
    },
    attributes: {
      exclude: ['frn_dpaccountid']
    }
  });

export const findCustomerPhoneNumbersByPhoneNumbersAndAccountId = async (
  phoneNumbers: string[],
  accountId: number
): Promise<string[]> => {
  const customerNumbers: any = await DPCustomer.findAll({
    where: {
      [Op.and]: [
        { frn_dpaccountid: { [Op.eq]: accountId } },
        { customer_number: { [Op.in]: phoneNumbers } }
      ]
    },
    attributes: ['customer_number'],
    raw: true
  });

  return customerNumbers.map((cn: any) => cn.customer_number);
};

export const createManyCustomers = (customers: Customer[]) =>
  DPCustomer.bulkCreate(customers);

export const updateReadStatusForSubscribedUsers = (
  userId: number,
  customerId: number
): Promise<any> =>
  DPCustomerDPUser.update(
    { read_status: CustomerThreadReadStatus.UNREAD },
    {
      where: {
        [Op.and]: [
          { frn_dpuserid: { [Op.ne]: userId } },
          { read_status: { [Op.ne]: CustomerThreadReadStatus.IGNORE } },
          { frn_dpcustomerid: { [Op.eq]: customerId } }
        ]
      }
    }
  );

export const getNoteFromLatestCustomerNoteEvent = (
  noteId: number
): Promise<any> =>
  DPCustomerNote.findOne({
    where: { id: noteId },
    attributes: {
      exclude: [
        'frn_dpcustomerid',
        'frn_dpuserid',
        'frn_dpcustomer_note_typeid'
      ]
    },
    include: [
      {
        model: DPUser,
        as: 'user',
        attributes: {
          exclude: [
            'frn_dpaccountid',
            'frn_dpnumberid',
            'available',
            'email',
            'user_active',
            'timezone_offset',
            'verificationCode',
            'verificationCodeCreatedAt'
          ]
        }
      },
      {
        model: DPCustomer,
        as: 'customer',
        attributes: {
          exclude: ['customer_number', 'customer_name', 'last_update']
        }
      },
      {
        model: DPCustomerNoteType,
        as: 'type'
      }
    ]
  });

export const findLastUpdateActionByCustomerId = (
  customerId: number
): Promise<any> =>
  DPCustomer.findOne({
    where: { id: customerId },
    attributes: ['last_update_action']
  });

export const findXConnects = async (
  customerId: number
): Promise<XConnect[]> => {
  const xConnects: any = await XConnectDPCustomer.findAll({
    where: { frn_dpcustomerid: customerId },
    attributes: ['id', 'connect_link'],
    include: [
      // @ts-ignore
      { model: XConnectModel, as: 'xconnect' }
    ]
  });

  return xConnects;
};

export const getCustomerRowCount = async (
  customerId: number,
  accountId: number
) =>
  DPCustomer.count({
    where: {
      id: customerId,
      frn_dpaccountid: accountId
    }
  });
