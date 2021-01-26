/* eslint-disable new-cap */
/* eslint-disable camelcase */
/* eslint-disable max-len */
'use strict';

const mongoose = require('mongoose');
require('dotenv').config();

const mongoURI = `mongodb+srv://MatthewBurruss:${process.env.MONGO_DEV_PASSWORD}@devopenmarket.mhwca.mongodb.net/${process.env.MONGO_DEV_DB_NAME}?retryWrites=true&w=majority`;
mongoose.Promise = global.Promise;
mongoose.connect(mongoURI, {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false});
mongoose.set('useCreateIndex', true);
mongoose.connection.on('error', () => {
  throw new Error(`unable to connect to database: ${mongoURI}`);
});


// const API = require('./api');
// const Users = require('./_user_data');
const helper = require('./helper');
require('@server/models/comment.model');

(async () => {
  console.log('Dropping data base...');
  await helper.dropDatabase(false);
  // console.log('Populating with users and adding their profile photos...');
  // for (let i = 0; i < Users.data.length; ++i) {
  //   const user_signup = helper.filterUser_signup(Users.data[i]); // signup
  //   const {_id, token} = await API.SignUp(user_signup);
  //   Users.data[i]['token'] = token;
  //   Users.data[i]['_id'] = _id;
  //   await API.UpdateProfilePhoto(_id, token, Users.data[i].avatar);
  // }
  // console.log('Setting up following relationship');
  // for (let i = 0; i < Users.data.length; ++i) {
  //   const follows = Users.data[i].follows;
  //   const token = Users.data[i].token;
  //   for (const index of follows) {
  //     const _id = Users.data[index]._id;
  //     await API.Follow(_id, token);
  //   }
  // }
  // console.log('Creating posts');
  // for (let i = 0; i < Users.data.length; ++i) {
  //   const posts = Users.data[i].posts;
  //   const token = Users.data[i].token;
  //   if (posts) {
  //     for (let j = 0; j < posts.length; ++j) {
  //       const post = posts[j];
  //       const postData = helper.filter_product_post_create(post);
  //       const _id = await API.CreateProductPost(postData, token);
  //       Users.data[i].posts[j]['_id'] = _id;
  //       const comments = posts[j].comments;
  //       if (comments) {
  //         for (let k = 0; k < comments.length; ++k) {
  //           const commentData = helper.filter_comment_create(comments[k]);
  //           const _id2 = await API.CreateComment(commentData, _id, token);
  //           console.log(`Created comment ${commentData.text}`);
  //           Users.data[i].posts[j].comments[k]['_id'] = _id2;
  //           const replies = comments[k].replies;
  //           if (replies) {
  //             for (let l = 0; l < replies.length; l++) {
  //               const reply_data = helper.filter_reply_create(replies[l]);
  //               const _id3 = await API.CreateReply(reply_data, _id2, token);
  //               Users.data[i].posts[j].comments[k].replies[l]['_id'] = _id3;
  //               console.log(`Created reply ${reply_data.text}`);
  //             }
  //           }
  //         }
  //       }
  //     }
  //   }
  // }
  // console.log('Creating comments');
})();
