import jwt from 'jsonwebtoken';
import { JWT_SECRET, JWT_LIFETIME } from '../config/constants';
import { TokenPayload } from '../types';

const SECRET = JWT_SECRET || 'default_secret';

export const generateToken = (payload: TokenPayload): string =>
  jwt.sign(payload, SECRET, { expiresIn: JWT_LIFETIME });

export const verifyToken = (token: string): TokenPayload =>
  jwt.verify(token, SECRET) as TokenPayload;
