import path from 'path';
import Sequelize from 'sequelize';

const EMAIL_REGEX = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
const PHONE_NUMBER_REGEX = /^(1|)?(\d{3})(\d{3})(\d{4})$/;

export const generateVerificationCode = (): number =>
  Math.floor(Math.random() * (999999 - 100000) + 100000);

export const getFileExtensionFromFileName = (fileName: string): string =>
  path.extname(fileName);

export const generateMySqlNOWFunction = () => Sequelize.fn('NOW');

export const validateEmail = (email: string) => {
  return EMAIL_REGEX.test(String(email).toLowerCase());
};

export const createEmailRecipient = (
  email: string,
  recipientFullName: string
): string => `${recipientFullName}<${email}>`;

/**
 *
 * @param phoneNumber eg. (123) 456-7890
 * @returns Formatted phone number as +11234567890
 */
export const formatPhoneNumber = (phoneNumber: string): string => {
  const normalized = ('' + phoneNumber).replace(/\D/g, '');
  const match = normalized.match(PHONE_NUMBER_REGEX);
  if (match) {
    return ['+1', match[2], match[3], match[4]].join('');
  }
  return '';
};
