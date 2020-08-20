"use strict"; 

//imports
import aws from 'aws-sdk';
import multer from 'multer';
import multerS3 from 'multer-s3';
import crypto from 'crypto';
import errorHandler from './dbErrorHandler';
import Image from '../models/image.model';
import StaticStrings from '../../config/StaticStrings';

// Configure S3
aws.config.update({
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  region: 'us-east-1'
});
const s3 = new aws.S3();

/**
  * @desc (Middleware) Ensures the form-data is an image file 
  * @param Object req - HTTP request
  * @param Object res - HTTP response
  * @param Function next - call back function (next middleware)
*/
const ImageFilter = (req, file, next) => {
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
    next(null, true)
  } else {
    next(new Error(StaticStrings.S3ServiceErrors.InvalidImageMimeType), false);
  }
}


/**
  * @desc (Middleware) Delete a specific file from S3 and the reference in MongoDB
  * @param String key - S3 file identifier
  * @return Returns a promise
*/
const deleteImageS3 = async (key) =>{
  let params = {
      Bucket: process.env.BUCKET_NAME,
      Key: key
  }
  try {
    await Image.deleteOne({'key':key});
    return s3.deleteObject(params).promise()
  } catch (err) {
    throw err;
  }
}

/**
  * @desc (Middleware) Upload an image to S3 and update MongoDB Image reference
  * @param Object req - HTTP request
  * @param Object res - HTTP response
  * @param Object meta - meta data of image object
  * @param Function next - callback function: parameters (HTTPRequest,HTTPResponse,mongoose.Schema.Image.model)
*/
const uploadImageS3 = (req,res,meta,next) => {
  const image_upload = multer({
    fileFilter: ImageFilter,
    storage: multerS3({
      s3,
      bucket: process.env.BUCKET_NAME,
      metadata: function (req, file, next) {
        next(null, {
            'type':meta.type,
            'user_id':meta.uploadedBy,
        });
      },
      key: function (req, file, next) {
          next(null, crypto.randomBytes(16).toString('hex') + `_${meta.type}`)
      }
    })
  });
  const upload = image_upload.single('image'); // Parse req and upload image to S3
  upload(req, res, async function (err) {
      if (err instanceof multer.MulterError) {
          return res.status(500).send({error:StaticStrings.S3ServiceErrors.BadRequestWrongKey})
      } else if (err) {
          return res.status(422).send({error:err.message});
      }
      if (!req.file){
        return res.status(400).json({error: StaticStrings.S3ServiceErrors.BadRequestMissingFile})
      }
      meta.key = req.file.key; // save image to MongoDB
      meta.mimetype = req.file.mimetype;
      meta.originalName = req.file.originalname;
      try {
        let image = new Image(meta);
        await image.save();
        next(req,res,image);
      } catch (err) {
        deleteImageS3(meta.key)
          .then(()=>{
            res.status(400).json({error: StaticStrings.S3ServiceErrors.BadImageUploadSuccessfulDelete + err.message})
          }).catch((err)=>{
            res.status(500).json({error: err.message+' and ' +errorHandler.getErrorMessage(err2)})
          })
      }
  })
}

/**
  * @desc Retrieves contents from S3 bucket
  * @return Returns a promise where the resolve contains the list of files in S3 and the
  * meta data of the bucket and reject contains the error
 */
const listObjectsS3 = () => {
  let params = {
    Bucket: process.env.BUCKET_NAME,
  }
  s3.listObjectsV2(params).promise();
};

/**
  * @desc Send image from S3 in HTTP response
  * @param Mongoose.schema.model.Image image - MongoDB image object
  * @return Returns a promise where the resolve contains the image data and reject
  * contains the error
*/
const getImageS3 = (image) => {
  let params = {
    Bucket: process.env.BUCKET_NAME,
    Key: image.key
  }
  return s3.getObject(params).promise()
}

/**
  * @desc Send image from S3 in HTTP response
  * @param String key     - S3 object key
  * @return Returns a promise where the resolve contains the image meta data
  * and the reject contains an error
*/
const fileExistsS3 = async (key) => {
  let params = {
    Bucket: process.env.BUCKET_NAME,
    Key: key
  }
  return s3.headObject(params).promise();
}


export default {
    uploadImageS3,
    deleteImageS3,
    getImageS3,
    listObjectsS3,
    fileExistsS3
}

// Missing secret
// {
//     "error": "The request signature we calculated does not match the signature you provided. Check your key and signing method."
// }

// Missing Access Key
// {
//     "error": "The AWS Access Key Id you provided does not exist in our records."
// }

// No bucket policy excusing the user making the call or role or whatever
// {
//     "error": "Access Denied: No access to S3 bucket. Check bucket policy."
// }
