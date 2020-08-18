"use strict"; 

//imports
import aws from 'aws-sdk';
import multer from 'multer';
import multerS3 from 'multer-s3';
import crypto from 'crypto';
import errorHandler from './dbErrorHandler';
import Image from '../models/image.model';

// configure environment
aws.config.update({
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  region: 'us-east-1'
});

const s3 = new aws.S3();

const ImageFilter = (req, file, next) => {
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
    next(null, true)
  } else {
    next(new Error('Invalid Mime Type, only JPEG and PNG'), false);
  }
}


const deleteFileS3 = async (key) =>{
  let params = {
      Bucket: process.env.BUCKET_NAME,
      Key: key
  }
  try {
    await Image.deleteOne({'key':key});
  } catch (err) {
    console.log(err);
  }
  s3.deleteObject(params, function(err, data) {
      if (err) console.log(err);
  });
}

const uploadImageToS3 = (req,res,meta,imageHandler) => {
  const image_upload = multer({
    fileFilter: ImageFilter,
    storage: multerS3({
      s3,
      bucket: process.env.BUCKET_NAME,
      metadata: function (req, file, next) {
        next(null, {
            'type':meta.type,
            'user_id':meta.uploadedBy
        });
      },
      key: function (req, file, next) {
          next(null, crypto.randomBytes(16).toString('hex') + `_meta.type`)
      }
    })
  });
  const upload = image_upload.single('image');
  return upload(req, res, async function (err) {
      if (err instanceof multer.MulterError) {
          return res.status(500).send({error:"Bad request: Check key in form data (should be 'image')"})
      } else if (err) {
          return res.status(422).send({error:err.message});
      }
      meta.key = req.file.key;
      meta.mimetype = req.file.mimetype;
      meta.originalName = req.file.originalname;
      try {
        let image = new Image(meta);
        await image.save();
        return imageHandler(req,res,image)
      } catch (err) {
        return res.status(400).json({
          error: errorHandler.getErrorMessage(err)
        })
      }
  })
}

const getImageFromS3 = (req,res,image) => {
  let params = {
    Bucket: process.env.BUCKET_NAME,
    Key: image.key
  }
  s3.getObject(params,function(err,data){
    if (err){
      res.status(404).json({message:err.message})
    } else {
      try {
        res.setHeader('Content-Length', data.ContentLength);
        res.setHeader('Content-Type', image.mimetype);
        res.write(data.Body)
        res.end(null);
      } catch {
        res.status(500).json({message:'ServerError: Unable to send S3 image.'})
      }
    }
  });
}

const listObjectsS3 = () => {
  let params = {
    Bucket: process.env.BUCKET_NAME,
  }
  return s3.listObjectsV2(params, function(err,data){
    if (err){
      console.log(err);
    } else {
      console.log(data);
    }
  });
};

export default {
    uploadImageToS3,
    deleteFileS3,
    getImageFromS3,
    listObjectsS3,
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

