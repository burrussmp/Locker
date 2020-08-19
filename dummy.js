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
const fetch = require("node-fetch");
const fs = require('fs');
let body = {
    "login": 'admin',
    "password": 'Admin123$'
};

function equal (buf1, buf2)
{
    if (buf1.byteLength != buf2.byteLength) return false;
    var dv1 = new Int8Array(buf1);
    var dv2 = new Int8Array(buf2);
    for (var i = 0 ; i != buf1.byteLength ; i++)
    {
        if (dv1[i] != dv2[i]) return false;
    }
    return true;
}

return fetch('http://localhost:3000/auth/login', {
    method: 'post',
    body: JSON.stringify(body),
    headers: {
      'content-type': 'application/json',
    },
    credentials: "include"
  }).then(res=>{
      return res.json();
  }).then(data=>{
      let token = data.token;
      let id = data.user._id;
      fetch('http://localhost:3000/api/users/'+id+'/avatar', {
        method: 'get',
        headers: {
          'content-type': 'application/json',
          'Authorization' : `Bearer ${token}`
        },
        credentials: "include"
      }).then(res=>res.blob())
        .then(async res=>{
            let buffer = await res.arrayBuffer();
            fs.readFile(process.cwd()+'/client/assets/images/profile-pic.png', function (err, data) {
                if (err) throw err;
                if (equal(data,buffer)){
                    console.log('same')
                }
                
            });
        })
  })
