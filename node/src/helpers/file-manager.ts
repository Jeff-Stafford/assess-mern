import { Request } from 'express';
import AWS from 'aws-sdk';
import multer from 'multer';
import multerS3 from 'multer-s3';
import { AWS_CONFIG, AWS_S3_BUCKET } from '../config/constants';
import { getFileExtensionFromFileName } from '../utils';
import { verifyToken } from '../security';

const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION } = AWS_CONFIG;

const s3 = new AWS.S3({
  accessKeyId: AWS_ACCESS_KEY_ID,
  secretAccessKey: AWS_SECRET_ACCESS_KEY,
  region: AWS_REGION,
  apiVersion: '2006-03-01'
});

const allowableImageTypes = ['image/jpeg', 'image/png'];
const allowableAudioTypes = ['audio/mpeg', 'audio/wav'];

const _isItemIncludedInItems = (item: string, items: string[]): boolean =>
  items.includes(item);

const _getAccountIdFromAutHeader = (authHeader: string): number => {
  const authToken = authHeader.replace('Bearer ', '');
  const { accountId } = verifyToken(authToken);
  return accountId;
};

const imagesFilter = (_: Request, file: any, cb: Function) => {
  if (!_isItemIncludedInItems(file.mimetype, allowableImageTypes)) {
    return cb(null, false);
  }
  cb(null, true);
};

const audioFilter = (_: Request, file: any, cb: Function) => {
  if (!_isItemIncludedInItems(file.mimetype, allowableAudioTypes)) {
    return cb(null, false);
  }
  cb(null, true);
};

const userAvatarKey = (req: Request, file: any, cb: Function) => {
  const userId = req.params.userId;
  const authHeader = req.header('authorization') || '';
  try {
    const accountId = _getAccountIdFromAutHeader(authHeader);
    cb(
      null,
      `avatars/${accountId}/${userId}/${Date.now().toString(
        36
      )}${getFileExtensionFromFileName(file.originalname)}`
    );
  } catch (error) {
    cb('Not authorized');
  }
};

const accountAvatarKey = (req: Request, file: any, cb: Function) => {
  const authHeader = req.header('authorization') || '';
  try {
    const accountId = _getAccountIdFromAutHeader(authHeader);
    cb(
      null,
      `avatars/${accountId}/${Date.now().toString(
        36
      )}${getFileExtensionFromFileName(file.originalname)}`
    );
  } catch (error) {
    cb('Not authorized');
  }
};

const huntGreetingKey = (req: Request, file: any, cb: Function) => {
  const authHeader = req.header('authorization') || '';
  try {
    const accountId = _getAccountIdFromAutHeader(authHeader);
    cb(
      null,
      `greetings/${accountId}/${Date.now().toString(
        36
      )}${getFileExtensionFromFileName(file.originalname)}`
    );
  } catch (err) {
    cb('Not authorized');
  }
};

const userAvatarStorage = multerS3({
  s3,
  bucket: AWS_S3_BUCKET,
  metadata: (_: Request, file: any, cb: Function) => {
    cb(null, { fieldName: file.fieldname });
  },
  contentType: (_: Request, file: any, cb: Function) => {
    cb(null, file.mimetype);
  },
  key: userAvatarKey
});

const huntGreetingStorage = multerS3({
  s3,
  bucket: AWS_S3_BUCKET,
  metadata: (_: Request, file: any, cb: Function) => {
    cb(null, { fieldName: file.fieldname });
  },
  contentType: (_: Request, file: any, cb: Function) => {
    cb(null, file.mimetype);
  },
  key: huntGreetingKey
});

const userAvatarUploader = multer({
  fileFilter: imagesFilter,
  storage: userAvatarStorage
});

const huntGreetingUploader = multer({
  fileFilter: audioFilter,
  storage: huntGreetingStorage
});

export const userAvatarFileUploader = (fieldName: string) =>
  userAvatarUploader.single(fieldName);

export const huntGreetingFileUploader = (fieldName: string) =>
  huntGreetingUploader.single(fieldName);

export const deleteRemoteFile = async (fileUrl: string): Promise<any> =>
  new Promise((resolve, reject) => {
    s3.deleteObject(
      {
        Bucket: AWS_S3_BUCKET,
        Key: new URL(fileUrl).pathname.substring(1)
      },
      (error, data) => {
        if (error) {
          return reject(error);
        }
        resolve(data);
      }
    );
  });
