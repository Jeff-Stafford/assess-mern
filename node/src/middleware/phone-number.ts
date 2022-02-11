import { Request, Response, NextFunction } from 'express';
import HttpStatus from 'http-status-codes';
import { findByNumberDid } from '../services/phone-number';

export const isReadyToCreate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { number_label, number_did, number_type } = req.body;
  if (!number_did || !number_label || !number_type) {
    return res.status(HttpStatus.BAD_REQUEST).json({
      message: 'number_did, number_label and number_type are required'
    });
  }
  const existingPhoneNumber = await findByNumberDid(number_did);
  if (existingPhoneNumber) {
    return res
      .status(HttpStatus.CONFLICT)
      .json({ message: 'number_did already exists' });
  }
  next();
};
