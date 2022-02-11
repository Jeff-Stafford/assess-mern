import { TokenPayload } from '../../types';

declare global {
  namespace Express {
    interface Request {
      tokenPayload: TokenPayload;
      pagination?: {
        page: number;
        limit: number;
      };
    }
  }
}
