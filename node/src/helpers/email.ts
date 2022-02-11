import AWS from 'aws-sdk';
import {
  AWS_CONFIG,
  EMAIL_SENDER,
  EMAIL_CONFIGURATION_SET
} from '../config/constants';

const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION } = AWS_CONFIG;

const awsEmailer = new AWS.SES({
  accessKeyId: AWS_ACCESS_KEY_ID,
  secretAccessKey: AWS_SECRET_ACCESS_KEY,
  region: AWS_REGION,
  apiVersion: '2010-12-01'
});

export const sendEmail = (
  recipients: string[],
  subject: string,
  message: string
) =>
  awsEmailer
    .sendEmail({
      Source: EMAIL_SENDER || '',
      Destination: {
        ToAddresses: recipients
      },
      Message: {
        Body: {
          Html: {
            Charset: 'UTF-8',
            Data: message
          }
        },
        Subject: {
          Charset: 'UTF-8',
          Data: subject
        }
      },
      ConfigurationSetName: EMAIL_CONFIGURATION_SET
    })
    .promise();
