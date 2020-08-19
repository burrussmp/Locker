// "use strict"; 

// //imports
// const aws = require('aws-sdk');
// require('dotenv').config();


// // configure environment
// aws.config.update({
//   secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
//   accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//   region: 'us-east-1'
// });

// const s3 = new aws.S3();

// const listObjectsS3 = (next) => {
//     let params = {
//       Bucket: process.env.BUCKET_NAME,
//     }
//     s3.listObjectsV2(params, function(err,data){
//       if (err){
//         console.log(err);
//       } else {
//         next(data);
//       }
//     });
//   };

