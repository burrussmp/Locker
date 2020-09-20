"use strict";

// imports
import StaticStrings from "../../config/StaticStrings";
import S3_Services from "../services/S3.services";
import Sharp from "sharp";
import media from "../models/media.model";

const ErrorMessages = StaticStrings.MediaControllerErrors;

const __allowed_media_types__ = ["Avatar", "ContentPost"];
const __allowed_media_sizes__ = ["small", "medium", "large", "xlarge"];
const All_Dimensions = {
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
  ContentPost: {
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
 * @desc Get media from S3 bucket
 * @param Object req - HTTP request object
 * @param Object res - HTTP response object
 */
const mediaExists = (req, res, next, key) => {
  // assert that it exists in S3
  return S3_Services.fileExistsS3(key)
    .then(() => {
      return next();
    })
    .catch((err) => {
      return res
        .status(404)
        .json({ error: ErrorMessages.MediaNotFound });
    });
};

/**
 * @desc Get media from S3 bucket
 * @param {object} req - HTTP request object
 * @param {object} res - HTTP response object
 * @param {String} key - S3 file identifier
 */
const getMediaByKey = (req, res, key) => {
  return S3_Services.getMediaS3(key)
    .then((data) => {
      try {
        res.setHeader("Content-Length", data.ContentLength);
        res.write(data.Body);
        return res.end(null);
      } catch (err) {
        return res
          .status(500)
          .json({ message: StaticStrings.S3ServiceErrors.RetrieveServerError });
      }
    })
    .catch((err) => {
      return res.status(500).json({ error: err.message });
    });
};

/**
 * @desc Get media from S3 bucket with new dimensions
 * @param {object} req - HTTP request object
 * @param {object} res - HTTP response object
 * @param {String} key - S3 file identifier
 */
const getMediaByKeyResize = async (req, res, key) => {
  const size = req.query.size;
  const media_type = res.locals.media_type
    ? res.locals.media_type
    : req.query.media_type;
  if (!media_type || !__allowed_media_types__.includes(media_type)) {
    return res.status(400).json({
      error: ErrorMessages.MediaTypeQueryParameterInvalid,
    });
  }
  if (!size || !__allowed_media_sizes__.includes(size)){
    return res.status(400).json({
      error: ErrorMessages.SizeQueryParameterInvalid
    }); 
  }
  let dimensions = All_Dimensions[media_type][size]
  const {width,height} = dimensions;
  let resized_key = key + "_" + 'width_' + width + '_height_' + height;
  try {
    let resized_media = await S3_Services.getMediaS3(resized_key);
    try {
      res.setHeader("Content-Length", resized_media.ContentLength);
      res.write(resized_media.Body);
      return res.end(null);
    } catch (err) {
      return res
        .status(500)
        .json({ message: StaticStrings.UnknownServerError });
    }
  } catch (err) {
    try {
      let { width, height } = dimensions;
      let original_media = await S3_Services.getMediaS3(key);
      if (original_media.Metadata.type != media_type){
        return res.status(400).json({error: ErrorMessages.MediaTypeDoesntMatchMetaData});
      }
      if (
        original_media.ContentType != "image/png" &&
        original_media.ContentType != "image/jpeg"
      ) {
        return res.status(400).json({
          error: ErrorMessages.CannotResizeNotImage
        });
      } else {
        let buffer = await Sharp(original_media.Body)
          .resize(width, height)
          .toFormat("png")
          .toBuffer();
        await S3_Services.putObjectS3(resized_key, buffer, "image/png");
        let resized_media = await S3_Services.getMediaS3(resized_key);
        try {
          await media.findOneAndUpdate(
            { key: key },
            { $push: { resized_keys: resized_key } }
          );
          res.setHeader("Content-Length", resized_media.ContentLength);
          res.write(resized_media.Body);
          return res.end(null);
        } catch (err) {
          return res
            .status(500)
            .json({ message: StaticStrings.UnknownServerError});
        }
      }
    } catch (err) {
      return res
        .status(500)
        .json({ message: StaticStrings.S3ServiceErrors.RetrieveServerError });
    }
  }
};

/**
 * @desc Controller (pretty much a wrapper around getMEdiaBykey)
 * @param {object} req - HTTP request object
 * @param {object} res - HTTP response objec
 * @param {String} key - (Optional) can also be retrieved from URL path params
 */
const getMedia = (req, res) => {
  let key = req.params.key ? req.params.key : res.locals.key;
  if (!key) {
    return res.status(500).json({
      error: StaticStrings.UnknownServerError,
    });
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
