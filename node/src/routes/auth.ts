import express from 'express';
import {
  login,
  loginMobile,
  verifyLogin,
  loginV2,
  verifyLoginV2
} from '../controllers/auth';
import {
  checkVerificationCode,
  checkMobileVerificationCode,
  checkVerificationCodeV2
} from '../middleware/auth';

const authRouter = express.Router();
const authRouterV2 = express.Router();

authRouter.post('/login', login);
authRouter.post('/login/verify', checkVerificationCode, verifyLogin);

authRouter.post('/login/mobile', loginMobile);
authRouter.post(
  '/login/mobile/verify',
  checkMobileVerificationCode,
  verifyLogin
);

authRouterV2.post('/login', loginV2);
authRouterV2.post('/login/verify', checkVerificationCodeV2, verifyLoginV2);

export default {
  authRouter,
  authRouterV2
};
