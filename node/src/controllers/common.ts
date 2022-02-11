import { Request, Response } from 'express';
import HttpStatus from 'http-status-codes';
import { sendEmail } from '../helpers/email';
import { createEmailRecipient, validateEmail } from '../utils';

export const getHealthStatus = (_: Request, res: Response): void => {
  res.end('I am OK!');
};

export const subscribeToNewsletter = async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!validateEmail(email)) {
    return res
      .status(HttpStatus.BAD_REQUEST)
      .json({ message: 'Please provide a valid email.' });
  }

  await sendEmail(
    [
      createEmailRecipient('rw@tone.com', 'Reid Wakefield'),
      createEmailRecipient('pe@tone.com', 'Patrick Elverum')
    ],
    'New Newsletter Subscription',
    `New subscribed user from landing page: ${email}.`
  );

  res.status(HttpStatus.CREATED).json({ message: 'Subscription created.' });
};
