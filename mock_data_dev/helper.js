"use strict";

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

exports.filter_user_signup = filter_user_signup;
exports.filter_content_post_create = filter_content_post_create;
exports.filter_comment_create = filter_comment_create;
exports.filter_reply_create = filter_reply_create;