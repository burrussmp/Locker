"use strict";
//imports
import aws from "aws-sdk";
import multer from "multer";
import multerS3 from "multer-s3";
import crypto from "crypto";
import errorHandler from "./dbErrorHandler";
import Media from "../models/media.model";
import StaticStrings from "../../config/StaticStrings";
import config from "../../config/config";
import BlurHashEncoder from '../services/BlurHashEncoder';

// Configure AWS
aws.config.update({
  secretAccessKey: config.aws_config.aws_secret,
  accessKeyId: config.aws_config.aws_access_key,
  region: "us-east-1",
});

/**
 * @desc Send image from S3 in HTTP response
 * @param Mongoose.schema.model.Media image - MongoDB image object
 * @return Returns a promise where the resolve contains the image data and reject
 * contains the error
 */
const getMediaS3 = (key) => {
  let params = {
    Bucket: config.bucket_name,
    Key: key,
  };
  return s3.getObject(params).promise();
};

const s3 = new aws.S3();

/**
 * @desc (Middleware) Ensures the form-data is an image file
 * @param Object req - HTTP request
 * @param Object res - HTTP response
 * @param Function next - call back function (next middleware)
 */
const MediaFilter = (req, file, next) => {
  let path = req.route.path;
  if (path == "/api/users/:userId/avatar" || path == "/api/ent/organizations"
    || path == "/api/ent/employees/:employeeId/avatar") {
    if (file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
      next(null, true);
    } else {
      next(
        new Error(StaticStrings.S3ServiceErrors.InvalidImageMimeType),
        false
      );
    }
  } else if (path == "/api/posts") {
    if (
      file.mimetype === "image/jpeg" ||
      file.mimetype === "image/png" ||
      file.mimetype === "video/mp4"
    ) {
      next(null, true);
    } else {
      next(
        new Error(StaticStrings.S3ServiceErrors.InvalidMediaMimeType),
        false
      );
    }
  } else {
    next(
      new Error("ServerError: You should not be able to upload from this path"),
      false
    );
  }
};

/**
 * @desc (Middleware) Delete a specific file from S3 and the reference in MongoDB
 * @param String key - S3 file identifier
 * @return Returns a promise
 */
const deleteMediaS3 = async (key) => {
  let params = {
    Bucket: config.bucket_name,
    Key: key,
  };
  try {
    await Media.deleteOne({ key: key });
    return s3.deleteObject(params).promise();
  } catch (err) {
    throw err;
  }
};

/**
 * @desc (Middleware) Upload a single image or video to S3 and update MongoDB Media reference
 * @todo NEED TO NOT GET MEDIA later and 
 * @param Object req - HTTP request
 * @param Object res - HTTP response
 * @param Object meta - meta data of image object
 * @param Function next - callback function: parameters (HTTPRequest,HTTPResponse,mongoose.Schema.Media.model)
 */
const uploadSingleMediaS3 = (req, res, meta, next) => {
  const image_upload = multer({
    fileFilter: MediaFilter,
    storage: multerS3({
      s3,
      bucket: config.bucket_name,
      contentType: multerS3.AUTO_CONTENT_TYPE,
      metadata: function (req, file, next) {
        next(null, {
          type: meta.type,
          uploader: meta.uploadedBy,
        });
      },
      key: function (req, file, next) {
        next(null, crypto.randomBytes(16).toString("hex") + `_${meta.type}`);
      },
    }),
  });
  const upload = image_upload.single("media"); // Parse req and upload image to S3
  upload(req, res, async function (err) {
    if (err instanceof multer.MulterError) {
      return res
        .status(400)
        .send({ error: StaticStrings.S3ServiceErrors.BadRequestWrongKey });
    } else if (err) {
      return res.status(422).send({ error: err.message });
    }
    if (!req.file) {
      return res
        .status(400)
        .json({ error: StaticStrings.S3ServiceErrors.BadRequestMissingFile });
    }
    meta.key = req.file.key; // save image to MongoDB
    meta.mimetype = req.file.mimetype;
    meta.originalName = req.file.originalname;

    const image = await getMediaS3(req.file.key)
    const mimetype = image.ContentType;
    if (mimetype === "image/jpeg" || mimetype === "image/png") {
      meta.blurhash = await BlurHashEncoder.encodeBlurHash(image.Body, mimetype);
    }
    try {
      let image = new Media(meta);
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
            error: err.message + " and " + errorHandler.getErrorMessage(err2),
          });
        });
    }
  });
};

/**
 * @desc Retrieves contents from S3 bucket
 * @return Returns a promise where the resolve contains the list of files in S3 and the
 * meta data of the bucket and reject contains the error
 */
const listObjectsS3 = () => {
  let params = {
    Bucket: config.bucket_name,
    MaxKeys: 1000
  };
  return s3.listObjectsV2(params).promise();
};

/**
 * @desc Send image from S3 in HTTP response
 * @param String key     - S3 object key
 * @return Returns a promise where the resolve contains the image meta data
 * and the reject contains an error
 */
const fileExistsS3 = async (key) => {
  let params = {
    Bucket: config.bucket_name,
    Key: key,
  };
  return s3.headObject(params).promise();
};

/**
 * @desc Put a new object in S3 (buffer provided)
 * @param String key : S3 object key
 * @param buffer buffer : The buffer
 * @param string content_type : The content type (e.g. image/png)
 * @return Returns a promise where the resolve contains the image meta data
 * and the reject contains an error
 */
const putObjectS3 = async (key, buffer, content_type) => {
  let params = {
    Bucket: config.bucket_name,
    Key: key,
    ContentType: content_type,
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
  putObjectS3
};
