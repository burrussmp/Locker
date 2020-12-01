/* eslint-disable new-cap */
/* eslint-disable max-len */
'use strict';

// imports
import mongoose from 'mongoose';
import Comment from '@server/models/comment.model';


/**
 * @desc Add a reply to a comment
 * @param {String} commentId The ID of comment
 * @param {String} reqId The ID of the requester
 * @param {object} replyId If defined retrieve a particular reply else retrieve all replies
 * @return {Promise<object>} A promise that resolves to the reply object
*/
const fetchReplies = async (commentId, reqId, replyId=undefined) => {
  commentId = mongoose.Types.ObjectId(commentId);
  reqId = mongoose.Types.ObjectId(reqId);
  const pipeline = [
    {$match: {_id: commentId}},
    {$project: {'_id': 0, 'replies': '$replies'}},
    {$unwind: '$replies'},
    {
      $project: {
        'text': '$replies.text',
        'postedBy': '$replies.postedBy',
        'createdAt': '$replies.createdAt',
        '_id': '$replies._id',
        'likes': {$cond: {if: {$isArray: '$replies.likes'}, then: {$size: '$replies.likes'}, else: 0}},
        'liked': {$cond: {if: {$and: [{$isArray: '$replies.likes'}, {$in: [reqId, '$replies.likes']}]}, then: true, else: false}},
      },
    },
  ];
  if (replyId) {
    replyId = mongoose.Types.ObjectId(replyId);
    pipeline.splice(3, 0, {$match: {'replies._id': replyId}});
  }
  return Comment.aggregate(pipeline).exec();
};


/**
 * @desc Add a reply to a comment
 * @param {String} commentId The ID of comment
 * @param {object} reply Has a 'text' and a 'postedBy' attribute
 * @return {Promise<object>} A promise that resolves to the reply object
*/
const addReply = async (commentId, reply) => {
  const comment = await Comment.findOneAndUpdate({'_id': commentId}, {$push: {
    replies: {
      text: reply.text,
      postedBy: reply.postedBy,
    },
  }},
  {runValidators: true, new: true});
  return comment.replies[comment.replies.length-1];
};

/**
 * @desc Edit the text of a reply
 * @param {String} commentId The ID of comment
 * @param {String} replyId The ID of the reply to delete
 * @param {String} newText The new text of the reply
 * @return {Promise<object>} A promise that resolves to the reply object
*/
const editReply = async (commentId, replyId, newText) => {
  const comment = await Comment.findOneAndUpdate(
      {'_id': commentId, 'replies._id': replyId},
      {$set: {'replies.$.text': newText}},
      {runValidators: true, new: true});
  return comment.replies.id(replyId);
};

/**
 * @desc Delete a reply
 * @param {String} commentId The ID of comment
 * @param {String} replyId The ID of the reply to delete
 * @return {Promise<object>} A promise that resolves to the reply object
*/
const deleteReply = async (commentId, replyId) => {
  const comment = await Comment.findByIdAndUpdate(commentId,
      {$pull: {replies: {'_id': replyId}}},
      {runValidators: true, new: false});
  return comment.replies.id(replyId);
};

/**
 * @desc Like a comment
 * @param {String} commentId The ID of comment to like
 * @param {String} likerId The ID of the person liking the comment
 * @return {Promise<String>} A promise that resolves to the comment object
*/
const likeComment = async (commentId, likerId) => {
  return Comment.findOneAndUpdate(
      {'_id': commentId},
      {$addToSet: {likes: likerId}}); // update their account
};

/**
 * @desc Unlike a comment
 * @param {String} commentId The ID of comment to like
 * @param {String} likerId The ID of the person liking the comment
 * @return {Promise<String>} A promise that resolves to the comment object
*/
const unlikeComment = async (commentId, likerId) => {
  return Comment.findOneAndUpdate(
      {'_id': commentId},
      {$pull: {likes: likerId}}); // update their account
};


/**
 * @desc like a reply
 * @param {String} commentId The ID of comment to like
 * @param {String} replyId The ID of the reply
 * @param {String} likerId The ID of the person liking the reply
 * @return {Promise<object>} A promise that resolves to the reply object
*/
const likeReply = async (commentId, replyId, likerId) => {
  const comment = await Comment.findOneAndUpdate(
      {'_id': commentId, 'replies._id': replyId},
      {$addToSet: {'replies.$.likes': likerId}},
      {runValidators: true, new: true});// update their account
  return comment.replies.id(replyId);
};

/**
 * @desc Unlike a reply
 * @param {String} commentId The ID of comment to like
 * @param {String} replyId The ID of the reply
 * @param {String} likerId The ID of the person unliking the reply
 * @return {Promise<object>} A promise that resolves to the reply object
*/
const unlikeReply = async (commentId, replyId, likerId) => {
  const comment = await Comment.findOneAndUpdate(
      {'_id': commentId, 'replies._id': replyId},
      {$pull: {'replies.$.likes': likerId}},
      {runValidators: true, new: true});// update their account
  return comment.replies.id(replyId);
};

export default {
  fetchReplies,
  addReply,
  likeComment,
  unlikeComment,
  editReply,
  deleteReply,
  likeReply,
  unlikeReply,
};


/*
    * Deprecated
    This query returns a reply and populates the postedBy and profile photo
        { $match: { _id : id } },
    { $project : {"_id":0, "replies": "$replies" }},
    { $unwind : "$replies"},
    { $lookup: {from: 'users', localField: 'replies.postedBy', foreignField: '_id', as: 'postedBy'} },
    { $unwind:'$postedBy'},
    { $lookup: {from: 'images', localField: 'postedBy.profile_photo', foreignField: '_id', as: 'postedBy.profile_photo'} },
    {
        $project: {
           "text" : "$replies.text",
           "postedBy" : {
               "username" : "$postedBy.username",
               "profile_photo" :  {
                    "key" : "$postedBy.profile_photo.key",
                    "mimetype": "$postedBy.profile_photo.mimetype"
               }
           },
           "updatedAt" : "$replies.updatedAt",
           "createdAt" : "$replies.createdAt",
           "likes": {$cond: { if: { $isArray: "$replies.likes" }, then: { $size: "$replies.likes" }, else: 0}},
        }
     },
     { "$unwind": { "path": "$postedBy.profile_photo", "preserveNullAndEmptyArrays": true }},
     { "$unwind": { "path": "$postedBy.profile_photo.key", "preserveNullAndEmptyArrays": true }},
     { "$unwind": { "path": "$postedBy.profile_photo.mimetype", "preserveNullAndEmptyArrays": true }}
*/
