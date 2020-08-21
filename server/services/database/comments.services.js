"use strict";

// imports
import mongoose from 'mongoose';
import Comment from '../../models/comment.model';

/**
 * @desc Returns the replies of a specific comment
 * @param String commentId - The ID of the Mongoose comment
 * @param String reqId - The ID of the person requesting
 * @return A promise of a list of the replies has the number of likes, _id, text, and creation time.
 */
const fetchReplies = async (commentId,reqId) => {
    let id = mongoose.Types.ObjectId(commentId);
    reqId = mongoose.Types.ObjectId(reqId);
    return Comment.aggregate([
        { $match: { _id : id } },
        { $project : {"_id":0, "replies": "$replies" }},
        { $unwind : "$replies"},
        {
            $project: {
            "text" : "$replies.text",
            "postedBy" : "$replies.postedBy",
            "createdAt" : "$replies.createdAt",
            "likes": {$cond: { if: { $isArray: "$replies.likes" }, then: { $size: "$replies.likes" }, else: 0}},
            "liked": {$cond: { if: { $and : [{$isArray: "$replies.likes" },{ $in: [ reqId, "$replies.likes" ] }	]}, then: true, else: false}},
            }
        },

    ]).exec();
};


/**
 * @desc Adds a reply to a specific object.
 * @param String commentId - The ID of the Mongoose comment
 * @param Object reply - The reply (should have a text and postedBy field)
 * @return a promise to the updated comment object.
 */
const addReply = async (commentId,reply) => {
    return Comment.findOneAndUpdate({'_id':commentId},{$push: { 
        replies:{
            text: reply.text,
            postedBy: reply.postedBy,
        }
    }},
    {runValidators:true});
};

const likeComment = async (commentId,likerId) => {
    return Comment.findOneAndUpdate(
        {'_id' : commentId}, 
        {$addToSet: {likes: likerId}}) // update their account
}

const unlikeComment = async (commentId,likerId) => {
    return Comment.findOneAndUpdate(
        {'_id' : commentId}, 
        {$pull: {likes: likerId}}) // update their account
}

export default {
    fetchReplies,
    addReply,
    likeComment,
    unlikeComment
}


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