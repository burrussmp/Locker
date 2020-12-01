/* eslint-disable max-len */
'use strict';

// imports
import Sharp from 'sharp';

import Media from '@server/models/media.model';

import S3Services from '@server/services/S3.services';

import StaticStrings from '@config/StaticStrings';

const ErrorMessages = StaticStrings.MediaControllerErrors;

const AllDimensions = {
  Avatar: {
    small: {
      width: 32,
      height: 32,
    },
    medium: {
      width: 64,
      height: 64,
    },
    large: {
      width: 128,
      height: 128,
    },
    xlarge: {
      width: 256,
      height: 256,
    },
  },
  Logo: {
    small: {
      width: 32,
      height: 32,
    },
    medium: {
      width: 64,
      height: 64,
    },
    large: {
      width: 128,
      height: 128,
    },
    xlarge: {
      width: 256,
      height: 256,
    },
  },
  ProductPost: {
    small: {
      width: 50,
      height: 75,
    },
    medium: {
      width: 100,
      height: 150,
    },
    large: {
      width: 200,
      height: 500,
    },
    xlarge: {
      width: 400,
      height: 1000,
    },
  },
};

/**
 * @desc Middleware to check if media exists in S3 bucket
 * @param {Request} req HTTP request object
 * @param {Response} res HTTP response object
 * @param {Function} next The next middleware to call
 * @param {Number} key The key of the media in S3 bucket
 * @return {Promise<Response>} 404 if the media doesnt exist otherwise
 * continue to next middleware
 */
const mediaExists = (req, res, next, key) => {
  // assert that it exists in S3
  return S3Services.fileExistsS3(key)
      .then(() => {
        return next();
      })
      .catch((err) => {
        return res.status(404).json({error: ErrorMessages.MediaNotFound});
      });
};

/**
 * @desc Retrives media from S3 bucket
 * @param {Request} req HTTP request object
 * @param {Response} res HTTP response object
 * @param {Number} key The key of the media in S3 bucket
 * @return {Promise<Response>} Returns the media from the S3 bucket
 */
const getMediaByKey = (req, res, key) => {
  return S3Services.getMediaS3(key)
      .then((data) => {
        try {
          res.setHeader('Content-Length', data.ContentLength);
          res.write(data.Body);
          return res.end(null);
        } catch (err) {
          return res.status(500).json({message: StaticStrings.S3ServiceErrors.RetrieveServerError});
        }
      })
      .catch((err) => {
        return res.status(500).json({error: err.message});
      });
};


/**
 * @desc Retrives media from S3 bucket (resized)
 * @param {Request} req HTTP request object
 * @param {Response} res HTTP response object
 * @param {Number} key The key of the media in S3 bucket
 * @return {Promise<Response>} Returns the media from the S3 bucket
 */
const getMediaByKeyResize = async (req, res, key) => {
  const media = await Media.findOne({key: key});
  if (media.mimetype != 'image/png' && media.mimetype != 'image/jpeg') {
    return res.status(400).json({error: ErrorMessages.CannotResizeNotImage});
  }
  const typeSizes = AllDimensions[media.type];
  if (!typeSizes) {
    return res.status(501).json({error: ErrorMessages.MediaTypeNotImplementedResize});
  }
  const dimensions = typeSizes[req.query.size];
  if (!dimensions) {
    return res.status(400).json({error: ErrorMessages.SizeQueryParameterInvalid});
  }
  const {width, height} = dimensions;
  const resizedDimensionsKey = key + '_' + 'width_' + width + '_height_' + height;
  try {
    const resizedMedia = await S3Services.getMediaS3(resizedDimensionsKey);
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Length', resizedMedia.ContentLength);
    res.write(resizedMedia.Body);
    return res.end(null);
  } catch (err) {
    try {
      const originalMedia = await S3Services.getMediaS3(key);
      // eslint-disable-next-line new-cap
      const buffer = await Sharp(originalMedia.Body)
          .resize(width, height)
          .toFormat('png')
          .toBuffer();
      await S3Services.putObjectS3(resizedDimensionsKey, buffer, 'image/png');
      const resizedMedia = await S3Services.getMediaS3(resizedDimensionsKey);
      await Media.findOneAndUpdate(
          {key: key},
          {$push: {'resized_keys': resizedDimensionsKey}},
      );
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Content-Length', resizedMedia.ContentLength);
      res.write(resizedMedia.Body);
      return res.end(null);
    } catch (err) {
      return res.status(500).json({error: err.message});
    }
  }
};

/**
 * @desc Retrieves media from S3 and optionally uses the resized query parameter
 * @param {Request} req HTTP request object
 * @param {Response} res HTTP response object
 * @param {Number} key The key of the media in S3 bucket
 * @return {Promise<Response>} Returns the media from the S3 bucket and if
 * first time specific size is specified, resizes and creates that sized media
 * in the S3 bucket
 */
const getMedia = (req, res) => {
  const key = req.params.key ? req.params.key : res.locals.key;
  if (!key) {
    return res.status(500).json({error: StaticStrings.UnknownServerError});
  }
  if (req.query.size) {
    return getMediaByKeyResize(req, res, key);
  } else {
    return getMediaByKey(req, res, key);
  }
};

export default {
  mediaExists,
  getMedia,
  getMediaByKey,
};
