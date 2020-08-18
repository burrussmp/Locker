"use strict"; 

import aws from 'aws-sdk';
import multer from 'multer';
import multerS3 from 'multer-s3';
import crypto from 'crypto';

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

function uploadProfilePhoto(req, res, next) {
    const profile_upload = multer({
        ImageFilter,
        storage: multerS3({
          s3,
          bucket: process.env.BUCKET_NAME,
          metadata: function (req, file, next) {
            next(null, {
                'type':'profile_photo',
                'user_id':req.params.userId
            });
          },
          key: function (req, file, next) {
              next(null, crypto.randomBytes(16).toString('hex') + '_profile_photo')
          }
        })
      })
    const upload = profile_upload.single('profile_photo');
    return upload(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            return res.status(500).send({error:'Multer error processing image'})
        } else if (err) {
            return res.status(422).send({error:'Access Denied: No access to S3 bucket. Check bucket policy.'});
        }
        next()
    })
}

const deleteFileS3 = (key) =>{
    let params = {
        Bucket: process.env.BUCKET_NAME,
        Key: key
    }
    s3.deleteObject(params, function(err, data) {
        if (err) console.log(err);
  });
}

const getFileS3 = (key) => {
  let params = {
    Bucket: process.env.BUCKET_NAME,
    Key: key
  }
  return s3.getObject(params, function (err, data) {
      if (err) console.log(err)
    }
  ).createReadStream();
};

export default {
    uploadProfilePhoto,
    deleteFileS3,
    getFileS3
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

