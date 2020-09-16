"use strict";

import User from '../server/models/user.model';
import Post from '../server/models/post.model';
import Media from '../server/models/media.model';
import mongoose from 'mongoose';

const filter_user_signup = (data) => {
  return {
    username: data.username,
    first_name: data.first_name,
    last_name: data.last_name,
    email: data.email,
    phone_number: data.phone_number,
    password: data.password,
  };
};

const filter_content_post_create = (data) => {
    return {
      media: data.media,
      price: data.price,
      caption: data.caption,
      tags: data.tags,
    };
  };

const filter_comment_create = (data) => {
  return {
    text: data.text,
  };
};

const filter_reply_create = (data) => {
  return {
    text: data.text,
  };
};

const drop_database = async () => {
  let cursor = User.find().cursor();
  for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
      await doc.deleteOne();
  }
  cursor = Post.find().cursor();
  for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
      await doc.deleteOne();
  }
  return mongoose.connection.dropDatabase()
};

exports.filter_user_signup = filter_user_signup;
exports.filter_content_post_create = filter_content_post_create;
exports.filter_comment_create = filter_comment_create;
exports.filter_reply_create = filter_reply_create;
exports.drop_database = drop_database;