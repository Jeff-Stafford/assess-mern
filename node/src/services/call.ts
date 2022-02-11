import { Op } from 'sequelize';
import DPCall from '../models/DPCall';
import DPCallDPUser from '../models/DPCallDPUser';
import DPCallRecording from '../models/DPCallRecording';
import DPCallResult from '../models/DPCallResult';
import DPCallType from '../models/DPCallType';
import DPCustomer from '../models/DPCustomer';
import DPUser from '../models/DPUser';
import DPCallTranscription from '../models/DPCallTranscription';
import { CallData, CustomerAndCallType } from '../types';
import { generateMySqlNOWFunction } from '../utils';

export const findCallData = async (
  callId: number,
  accountId: number
): Promise<CallData | null> => {
  const callData: any = await DPCall.findOne({
    where: { id: callId },
    attributes: ['id', 'start_datetime', 'call_duration_seconds'],
    include: [
      { model: DPCallType, as: 'type', attributes: ['type_description'] },
      { model: DPCallResult, as: 'result', attributes: ['result_description'] },
      {
        model: DPCallDPUser,
        as: 'users',
        attributes: ['frn_dpuserid'],
        include: [
          {
            model: DPUser,
            as: 'user',
            attributes: ['id', 'name_first', 'name_last', 'avatar']
          }
        ]
      },
      {
        model: DPCustomer,
        as: 'customer',
        attributes: ['id', 'customer_number', 'customer_name'],
        where: { frn_dpaccountid: accountId }
      },
      {
        model: DPCallRecording,
        as: 'recordings',
        attributes: ['recording_file'],
        where: {
          date_to_delete: { [Op.gt]: generateMySqlNOWFunction() }
        },
        required: false
      },
      {
        model: DPCallTranscription,
        as: 'transcriptions',
        attributes: ['transcription_data'],
        required: false
      }
    ]
  });

  if (!callData) {
    return null;
  }

  const { dataValues } = callData;

  return {
    call: {
      start_datetime: dataValues.start_datetime,
      call_duration_seconds: dataValues.call_duration_seconds,
      call_type: dataValues.type.type_description,
      call_result: dataValues.result.result_description
    },
    users: dataValues.users.map(({ user }: any) => user),
    customer: {
      id: dataValues.customer.id,
      customer_name: dataValues.customer.customer_name,
      customer_number: dataValues.customer.customer_number
    },
    recordings: dataValues.recordings,
    transcriptions: dataValues.transcriptions
  };
};

export const findCustomerIdByCallId = async (
  callId: number
): Promise<number> => {
  const call: any = await DPCall.findByPk(callId, {
    attributes: ['frn_dpcustomerid']
  });

  if (!call) {
    throw new Error('Call not found');
  }

  return call.dataValues.frn_dpcustomerid;
};

export const findCustomerAndCallTypeByCallId = async (
  callId: number
): Promise<CustomerAndCallType> => {
  const call: any = await DPCall.findByPk(callId, {
    attributes: ['id'],
    include: [
      { model: DPCallType, as: 'type' },
      {
        model: DPCustomer,
        as: 'customer',
        attributes: ['id', 'customer_number', 'customer_name']
      }
    ]
  });

  if (!call) {
    throw new Error(`Call ${callId} not found.`);
  }

  return {
    callType: call.dataValues.type.type_description,
    customer: {
      id: call.dataValues.customer.id,
      name: call.dataValues.customer.customer_name,
      number: call.dataValues.customer.customer_number
    }
  };
};
