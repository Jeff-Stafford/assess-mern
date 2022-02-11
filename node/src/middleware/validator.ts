import { Request, Response, NextFunction } from 'express';
import HttpStatus from 'http-status-codes';
import { getLogger } from '../helpers/logger';

const LOG = getLogger('validator-middleware');

export const createIdValidator = (idPlaceholderNames: string[]) => (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    for (const idPlaceholderName of idPlaceholderNames) {
      if (isNaN(+req.params[idPlaceholderName])) {
        throw new Error(`${idPlaceholderName} must be a number!`);
      }
    }
    next();
  } catch (err) {
    LOG.warn('ID validator: %s', err.message);
    res.status(HttpStatus.BAD_REQUEST).json({ message: err.message });
  }
};

export const createTenantValidator = (
  tenant: any,
  idPlaceholderName: string
) => async (
  { tokenPayload: { accountId }, params }: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const foundTenant = await tenant.findByPk(params[idPlaceholderName]);
    if (!foundTenant) {
      return res.status(HttpStatus.NOT_FOUND).end();
    }
    if (foundTenant.frn_dpaccountid !== accountId) {
      return res.status(HttpStatus.FORBIDDEN).end();
    }
    next();
  } catch (err) {
    LOG.warn('Tenant validator: %s', err.message);
    res.status(HttpStatus.BAD_REQUEST).json({ message: err.message });
  }
};
