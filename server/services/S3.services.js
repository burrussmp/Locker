/* eslint-disable max-len */
'use strict';
// imports
import aws from 'aws-sdk';
import multer from 'multer';
import multerS3 from 'multer-s3';
import crypto from 'crypto';
import errorHandler from './dbErrorHandler';
import Media from '../models/media.model';
import StaticStrings from '../../config/StaticStrings';
import config from '../../config/config';
import BlurHashEncoder from '../services/BlurHashEncoder';

// Configure AWS
aws.config.update({
  secretAccessKey: config.aws_config.aws_secret,
  accessKeyId: config.aws_config.aws_access_key,
  region: 'us-east-1',
});


/**
 * @desc Check if valid email
 * @param {String} key The key of the S3 object to retrieve
 * @return {Promise<PromiseResult<aws.S3.GetObjectOutput, aws.AWSError>>} An S3 Object
 */
const getMediaS3 = (key) => {
  const params = {
    Bucket: config.bucket_name,
    Key: key,
  };
  return s3.getObject(params).promise();
};

const s3 = new aws.S3();

/**
 * @desc Middleware to check if valid file type
 * @param {Request} req HTTP request object
 * @param {File} file A multer file object
 * @param {Function} next The next function to call
 */
const mediaFilter = (req, file, next) => {
  const path = req.route.path;
  if (path == '/api/users/:userId/avatar' || path == '/api/ent/organizations' ||
    path == '/api/ent/employees/:employeeId/avatar') {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
      next(null, true);
    } else {
      next(
          new Error(StaticStrings.S3ServiceErrors.InvalidImageMimeType),
          false,
      );
    }
  } else if (path == '/api/posts') {
    if (
      file.mimetype === 'image/jpeg' ||
      file.mimetype === 'image/png' ||
      file.mimetype === 'video/mp4'
    ) {
      next(null, true);
    } else {
      next(
          new Error(StaticStrings.S3ServiceErrors.InvalidMediaMimeType),
          false,
      );
    }
  } else {
    next(
        new Error('ServerError: You should not be able to upload from this path'),
        false,
    );
  }
};

/**
 * @desc Deletes an object from S3 bucket
 * @param {String} key The key of the object to delete
 * @return {Promise<Error, object>} Throws an error if unsuccessful or returns the deleted
 * S3 object
 */
const deleteMediaS3 = async (key) => {
  const params = {
    Bucket: config.bucket_name,
    Key: key,
  };
  try {
    await Media.deleteOne({key: key});
    return s3.deleteObject(params).promise();
  } catch (err) {
    throw err;
  }
};

/**
 * @desc (Middleware) Upload a single image or video to S3 and update MongoDB Media reference
 * @param {Request} req HTTP Request object
 * @param {Request} res HTTP response object
 * @param {object} meta Meta information to store alongside image
 * @param {Function} next The next middleware function to call
 */
const uploadSingleMediaS3 = (req, res, meta, next) => {
  const imageUpload = multer({
    fileFilter: mediaFilter,
    storage: multerS3({
      s3,
      bucket: config.bucket_name,
      contentType: multerS3.AUTO_CONTENT_TYPE,
      metadata: function(req, file, next) {
        next(null, {
          type: meta.type,
          uploader: meta.uploadedBy,
        });
      },
      key: function(req, file, next) {
        next(null, crypto.randomBytes(16).toString('hex') + `_${meta.type}`);
      },
    }),
  });
  const upload = imageUpload.single('media'); // Parse req and upload image to S3
  upload(req, res, async function(err) {
    if (err instanceof multer.MulterError) {
      return res
          .status(400)
          .send({error: StaticStrings.S3ServiceErrors.BadRequestWrongKey});
    } else if (err) {
      return res.status(422).send({error: err.message});
    }
    if (!req.file) {
      return res
          .status(400)
          .json({error: StaticStrings.S3ServiceErrors.BadRequestMissingFile});
    }
    meta.key = req.file.key; // save image to MongoDB
    meta.mimetype = req.file.mimetype;
    meta.originalName = req.file.originalname;

    const image = await getMediaS3(req.file.key);
    const mimetype = image.ContentType;
    if (mimetype === 'image/jpeg' || mimetype === 'image/png') {
      meta.blurhash = await BlurHashEncoder.encodeBlurHash(image.Body, mimetype);
    }
    try {
      const image = new Media(meta);
      await image.save();
      next(req, res, image);
    } catch (err) {
      deleteMediaS3(meta.key)
          .then(() => {
            res.status(400).json({
              error:
              StaticStrings.S3ServiceErrors.BadMediaUploadSuccessfulDelete +
              err.message,
            });
          })
          .catch((err) => {
            res.status(500).json({
              error: err.message + ' and ' + errorHandler.getErrorMessage(err2),
            });
          });
    }
  });
};

/**
 * @desc Retrieve a list of some of the objects in S3 Bucket (mainly used in unit tests)
 * @return {Promise<Error, object>} Returns a list of up to 1000 objects in S3 bucket
 */
const listObjectsS3 = () => {
  const params = {
    Bucket: config.bucket_name,
    MaxKeys: 1000,
  };
  return s3.listObjectsV2(params).promise();
};

/**
 * @desc Check if a file exists in S3 bucket
 * @param {String} key The key of the object in S3 bucket
 * @return {Promise<Error, object>} A promise that resolves if file exists in S3 Bucket
 */
const fileExistsS3 = async (key) => {
  const params = {
    Bucket: config.bucket_name,
    Key: key,
  };
  return s3.headObject(params).promise();
};

/**
 * @desc Check if a file exists in S3 bucket
 * @param {String} key The key of the object in S3 bucket
 * @param {Buffer} buffer The buffer array to store in S3
 * @param {String} contentType The type of content to write ex. image/png text/plain etc
 * @return {Promise<Error, object>} A promise that resolves if file exists in S3 Bucket
 */
const putObjectS3 = async (key, buffer, contentType) => {
  const params = {
    Bucket: config.bucket_name,
    Key: key,
    ContentType: contentType,
    Body: buffer,
  };
  return s3.putObject(params).promise();
};

export default {
  uploadSingleMediaS3,
  deleteMediaS3,
  getMediaS3,
  listObjectsS3,
  fileExistsS3,
  putObjectS3,
};
