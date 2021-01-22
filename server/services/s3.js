/* eslint-disable max-len */
'use strict';
// imports
const {v4: uuid4} = require('uuid');
import aws from 'aws-sdk';
import _ from 'lodash';
import multer from 'multer';

import Media from '@server/models/media.model';

import BlurHashEncoder from '@server/services/blur.hash.encoder';

import config from '@config/config';
import ErrorHandler from './error.handler';
import StaticStrings from '@config/StaticStrings';


// Configure AWS
aws.config.update({
  secretAccessKey: config.aws_config.aws_secret,
  accessKeyId: config.aws_config.aws_access_key,
  region: config.aws_config.region,
});


/**
 * @desc Check if valid email
 * @param {String} key The key of the S3 object to retrieve
 * @return {Promise<PromiseResult<aws.S3.GetObjectOutput, aws.AWSError>>} An S3 Object
 */
const getMediaS3 = (key) => {
  const params = {
    Bucket: config.aws_config.aws_bucket_name,
    Key: key,
  };
  return s3.getObject(params).promise();
};

const s3 = new aws.S3();

/**
 * @desc Deletes an object from S3 bucket
 * @param {String} key The key of the object to delete
 * @return {Promise<Error, object>} Throws an error if unsuccessful or returns the deleted
 * S3 object
 */
const deleteMediaS3 = async (key) => {
  const params = {
    Bucket: config.aws_config.aws_bucket_name,
    Key: key,
  };
  await Media.deleteOne({key: key});
  return s3.deleteObject(params).promise();
};

/**
 * @desc Retrieve a list of some of the objects in S3 Bucket (mainly used in unit tests)
 * @return {Promise<Error, object>} Returns a list of up to 1000 objects in S3 bucket
 */
const listObjectsS3 = () => {
  const params = {
    Bucket: config.aws_config.aws_bucket_name,
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
    Bucket: config.aws_config.aws_bucket_name,
    Key: key,
  };
  return s3.headObject(params).promise();
};

/**
 * @desc Place or update a file in S3
 * @param {String} key The key of the object in S3 bucket
 * @param {Buffer} buffer The buffer array to store in S3
 * @param {String} contentType The type of content to write ex. image/png text/plain etc
 * @param {Object} metaData Optional meta data
 * @return {Promise<Error, object>} A promise that resolves if file exists in S3 Bucket
 */
const putObjectS3 = async (key, buffer, contentType, metaData = undefined) => {
  const params = {
    Bucket: config.aws_config.aws_bucket_name,
    Key: key,
    ContentType: contentType,
    Body: buffer,
    Metadata: metaData,
  };
  return s3.putObject(params).promise();
};

/**
 * @desc Generate a filter to process a multer request to see if valid or whether
 * or not to reject the request.
 * @param {Object} mediaMeta HTTP request object
 * @return {function} Returns a function that accepts 3 parameters
 *  :req:Request: The HTTP request
 *  :file:File: The file from the multer parse
 *  :next:Function: A middleware function to call next
 *    The function throws an error if there is not metaData in regards to the field,
 *    If it is missing a 'mimeTypesAllowed' attribute that tells whether or not
 *    the support mimetype is allowed or if the actual mimetype of the file is not
 *    supported.
 */
const mediaFieldFilter = (mediaMeta) => {
  return (req, file, next) => {
    const fieldMeta = _.find(mediaMeta.fields, {'name': file.fieldname});
    if (!fieldMeta) {
      return next(new Error(`Server Error: Missing media meta for field ${file.fieldname}`), false);
    }
    if (!fieldMeta.mimeTypesAllowed) {
      return next(new Error(`Server Error: Missing array of allowed mime types in media meta for field ${file.fieldname}`), false);
    }
    const validMimeType = fieldMeta.mimeTypesAllowed.includes(file.mimetype);
    if (!validMimeType) {
      return next(new Error(`${StaticStrings.S3ServiceErrors.InvalidImageMimeType} ${fieldMeta.mimeTypesAllowed}. Received ${file.mimetype}`), false);
    } else {
      return next(null, true);
    }
  };
};
/**
 * @desc Add a buffer to S3 and create the media entry in Media collection.
 * @param {Buffer} buffer The buffer
 * @param {String} mimetype The mime type (image/png or image/jpeg)
 * @param {String} originalName The original name of the file
 * @param {String} mediaType The media type (typically the model name)
 * @param {String} uploadedBy The ID of who uploaded the image (typically requester)
 * @param {String} uploadedByType Either User or Employee
 * @return {Media} The generated media document.
 */
const createMedia = async (buffer, mimetype, originalName, mediaType, uploadedBy, uploadedByType) => {
  let blurhash = undefined;
  try {
    blurhash = (mimetype === 'image/jpeg' || mimetype === 'image/png') ? await BlurHashEncoder.encodeBlurHash(buffer, mimetype) : undefined;
  } catch (err) {
    console.log(`Unable to create a blur hash from file. Error: ${err}`);
  }
  const newMedia = {
    key: uuid4(),
    mimetype: mimetype,
    originalName: originalName,
    blurhash: blurhash,
    type: mediaType,
    uploadedBy: uploadedBy,
    uploadedByType: uploadedByType,
  };
  await putObjectS3(newMedia.key, buffer, mimetype, {
    type: mediaType,
    uploader: uploadedBy,
    uploadedByType: uploadedByType,
  });
  return await (new Media(newMedia)).save();
}

/**
 * @desc (Middleware) Upload multiple images to S3
 *  1. Upload images to S3
 *  2. Throw error if mediaMeta says field is required and no images are supplied
 *  3. Create blurhash from image if image/png or image/jpeg
 * @param {Request} req HTTP Request object
 * @param {Request} res HTTP response object
 * @param {object} mediaMeta Meta information to store alongside image
 * @param {Function} next The next middleware function to call
 */
const uploadFilesToS3 = (req, res, mediaMeta, next) => {
  const storage = multer.memoryStorage();
  const multerUpload = multer({fileFilter: mediaFieldFilter(mediaMeta), storage: storage});
  const upload = multerUpload.fields(mediaMeta.fields);
  upload(req, res, async function(err) {
    if (err instanceof multer.MulterError) {
      return res.status(400).send({error: StaticStrings.S3ServiceErrors.BadRequestUnexpectedField});
    } else if (err) {
      return res.status(422).send({error: err.message});
    }
    const allMedia = {};
    for (const fieldMeta of mediaMeta.fields) {
      if (fieldMeta.required && (!req.files || !req.files[fieldMeta.name])) {
        return res.status(400).json({error: StaticStrings.S3ServiceErrors.BadRequestMissingFile + `. Missing request field '${fieldMeta.name}'`});
      }
    }
    for (const fieldMeta of mediaMeta.fields) {
      allMedia[fieldMeta.name] = [];
      if (req.files && req.files[fieldMeta.name]) {
        for (const file of req.files[fieldMeta.name]) {
          try {
            const newMedia = await createMedia(file.buffer, file.mimetype, file.originalname, mediaMeta.type, mediaMeta.uploadedBy, mediaMeta.uploadedByType);
            allMedia[fieldMeta.name].push({'_id': newMedia._id, 'key': newMedia.key});
          } catch (err) {
            try {
              await deleteMediaS3(newMedia.key);
              res.status(400).json({error: StaticStrings.S3ServiceErrors.BadMediaUploadSuccessfulDelete + err.message});
            } catch (err2) {
              res.status(500).json({error: err.message + ' and ' + ErrorHandler.getErrorMessage(err2)});
            }
          }
        }
      }
    }
    next(req, res, allMedia);
  });
};

export default {
  createMedia,
  uploadFilesToS3,
  deleteMediaS3,
  getMediaS3,
  listObjectsS3,
  fileExistsS3,
  putObjectS3,
};
