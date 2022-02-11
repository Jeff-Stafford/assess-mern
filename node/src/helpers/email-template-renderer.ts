import fs from 'fs';
import path from 'path';
import ejs from 'ejs';

import { FRONTEND_HOST } from '../config/constants';

export const renderLoginEmail = (
  clientHost: string | undefined,
  verificationCode: number,
  userEmail: string,
  phoneNumber?: string
) => {
  const template = fs.readFileSync(
    path.join(__dirname, '../resources/email-templates/login.ejs'),
    { encoding: 'utf-8' }
  );
  const loginSource = phoneNumber
    ? `phone_number=${phoneNumber}`
    : `email=${userEmail}`;
  const loginURL = `${
    clientHost || FRONTEND_HOST
  }/login-verify?${loginSource}&verificationCode=${verificationCode}`;

  return ejs.render(template, { verificationCode, loginURL });
};
