
"use strict";

// imports
import Post from '../models/post.model'
import Comment from '../models/comment.model';
import StaticStrings from '../../config/StaticStrings';
import errorHandler from '../services/dbErrorHandler'
import ContentPostServices from "../services/database/content.post.services";
import mongoose from 'mongoose';

const ReactionTypes = mongoose.models.Post.schema.tree.reactions[0].tree.type.enum.values;

// The way privacy will work
//  1. Want to retrieve a post or comment or reply
//  2. When retrieving the key, check who it is posted by
//  3. If their account is public or if you are a follower of this person
//  then you can retrieve the resource
// How does it work for an image?
//  1. Let's say you want to look at a post and you need the media
//  2. You say get post and then get the media key. You then call
//  3. /api/media/:key and the server checks if the account associated with
//  4. that media post is public or private or if you are a follower
//  5. the server then retrieves the media source.


/**
  * @desc Retrieve the post by ID and sets ownership field of req to the id
  * @param Object   req   - HTTP request object
  * @param Object   res   - HTTP response object
  * @param Function next  - Next express middleware function
  * @param String   id    - The ID of the post
*/ 
const postByID = async (req,res,next,id) => {
  try {
    let post = await Post.findById(id);
    if (!post) {
        return res.status('404').json({
            error: StaticStrings.PostModelErrors.PostNotFoundError
        })
    }
    req.post = post
    req.owner = post.postedBy.toString();
    next()
  } catch (err) {
      return res.status(404).json({
          error: StaticStrings.PostModelErrors.PostNotFoundError
      })
  }
}


/**
 * @desc List all the posts (just id and who uploaded them)
 * @param Object   req - HTTP request object
 * @param Object   res - HTTP response object
 * @return A list of all the posts by their ID and when they were posted
 */
const listPosts = async (req,res) => {
  try {
    let posts = await Post.find().select('createdAt')
    return res.status(200).json(posts);
  }catch(err){
    return res.status(500).json({error:errorHandler.getErrorMessage(err)})
  }
}

/**
 * @desc Create a post
 * @param Object   req - HTTP request object
 * @param Object   res - HTTP response object
 * @return Creates a post
 */
const createPost = async (req,res) => {
  let type = req.query.type;
  if (type == 'ContentPost'){
    return ContentPostServices.createContentPost(req,res);
  } else {
    return res.status(501).json({error:StaticStrings.NotImplementedError})
  }
}


/**
 * @desc Gets a post by a particular ID
 * @param Object   req - HTTP request object
 * @param Object   res - HTTP response object
 * @return Gets post info: type, contentId, createdAt, caption, tags, postedBy, 
 */
const getPost = async (req,res) => {
  try {
    if (req.post.type == 'ContentPost'){
      return ContentPostServices.getContentPost(req,res)
    } else {
      return res.status(501).json({error:StaticStrings.NotImplementedError})
    }
  }catch(err){
    return res.status(500).json({error:StaticStrings.UnknownServerError +'\nReason: '+err.message})
  }
}

/**
 * @desc Edit a post. This delegates editing to the particular type of post
 * @param Object   req - HTTP request object
 * @param Object   res - HTTP response object
 * @return Creates a post
 */
const editPost = async (req,res) => {
  try {
    if (req.post.type == 'ContentPost'){
      return ContentPostServices.editContentPost(req,res)
    } else {
      return res.status(501).json({error:StaticStrings.NotImplementedError})
    }
  }catch(err){
    return res.status(500).json({error:StaticStrings.UnknownServerError +'\nReason: '+err.message})
  }
}

/**
 * @desc Delegates deletion to type of post
 * @param Object   req - HTTP request object
 * @param Object   res - HTTP response object
 */
const deletePost = async (req,res) => {
  try {
    let post = await Post.findById(req.params.postId);
    await post.deleteOne();
    return res.status(200).send(post);
  } catch (err){
    return res.status(500).send({error: StaticStrings.UnknownServerError+'\nReason: '+err.message});
  }
}

/**
 * @desc Gets all the comments from a post and returns their ID and creation timestamp
 * @param Object   req - HTTP request object
 * @param Object   res - HTTP response object
 */
const listComments = async (req,res) => {
  try {
    let post = await Post.findById(req.params.postId).populate({
      path: 'comments',
      select: 'createdAt'
    }).exec();
    return res.status(200).json({data:post.comments});
  }catch(err){
    return res.status(500).json({error:errorHandler.getErrorMessage(err)})
  }}

/**
 * @desc Retrieves a specific comment
 * @param Object   req - HTTP request object
 * @param Object   res - HTTP response object
 */
const getComment = async (req,res) => {
  try {
    let commentId = mongoose.Types.ObjectId(req.params.commentId);
    let reqId = mongoose.Types.ObjectId(req.auth._id);
    let comment = await Comment.aggregate([
      {$match: { _id : commentId }},
      {$project: {
        "text" : "$text",
        "postedBy" : "$postedBy",
        "createdAt" : "$createdAt",
        "likes": {$cond: { if: { $isArray: "$likes" }, then: { $size: "$likes" }, else: 0}},
        "liked": {$cond: { if: { $and : [{$isArray: "$likes" },{ $in: [ reqId, "$likes" ] }	]}, then: true, else: false}},
        }
      }
    ])
    return res.status(200).json(comment[0]);
  }catch(err){
    return res.status(500).json({error:errorHandler.getErrorMessage(err)})
  }
}


/**
 * @desc Creates a comment. The required fields are text, filling in postedBy.
 * @param Object   req - HTTP request object
 * @param Object   res - HTTP response object
 */
const createComment = async (req,res) => {
  try {
    let comment_data = {
      text: req.body.text,
      postedBy: req.auth._id,
      postId: req.params.postId
    }
    let new_comment = new Comment(comment_data);
    new_comment = await new_comment.save();
    try {
      await Post.findOneAndUpdate(
        {'_id':req.params.postId},
        {$push: {comments:new_comment._id }},
        {runValidators:true});
      return res.status(200).json({'_id':new_comment._id});
    } catch(err){
      return res.status(400).json({error:errorHandler.getErrorMessage(err)})
    }
  } catch(err){
    return res.status(400).json({error:errorHandler.getErrorMessage(err)})
  }
}

/**
 * @desc Deletes comments. No crazy clean up to do
 * @param Object   req - HTTP request object
 * @param Object   res - HTTP response object
 */
const deleteComment = async (req,res) => {
  try {
    let comment = await Comment.findById(req.params.commentId);
    await comment.deleteOne();
    return res.status(200).json({"_id":comment._id});
  } catch(err){
    return res.status(400).json({error:errorHandler.getErrorMessage(err)})
}}


/**
 * @desc List all reactions of a particular post
 * @param Object   req - HTTP request object
 * @param Object   res - HTTP response object
 */
const getReaction = async (req,res) => {
  try {
    let postId = mongoose.Types.ObjectId(req.params.postId);
    let reqId = mongoose.Types.ObjectId(req.auth._id);
    let reactions = await Post.aggregate([
      {$match: {"_id":postId}},
      {$unwind: "$reactions"},
      {$group: {
          "_id": "$reactions.type",
          "total": {$sum: 1},
          "selected": {$max: {$eq: ["$reactions.postedBy",reqId]}}}
      }
    ])
    let reactionData = Object.assign({selected:false}, ...Object.entries({...ReactionTypes}).map(([a,b]) => ({ [b]: 0 })))
    for (let reaction of reactions){
      reactionData[reaction._id] = reaction.total;
      if (reaction.selected) reactionData.selected=reaction._id;
    }
    return res.status(200).json(reactionData);
  }catch(err){
    return res.status(500).json({error:errorHandler.getErrorMessage(err)})
  }}

/**
 * @desc Change the reaction. You can react to your own post
 * @param Object   req - HTTP request object
 * @param Object   res - HTTP response object
 */
const changeReaction = async (req,res) => {
  try {
    if (!ReactionTypes.includes(req.body.reaction)){
      return res.status(400).json({error:StaticStrings.PostModelErrors.InvalidReaction})
    } else {
      let reaction = {
        type:req.body.reaction,
        postedBy:req.auth._id
      };
      let post = await Post.findOne({'_id':req.params.postId,'reactions.postedBy':req.auth._id});
      if (post){
        post = await Post.findOneAndUpdate({'_id':req.params.postId,'reactions.postedBy':req.auth._id},{ $set:{ "reactions.$.type": reaction.type } },)        
      } else {
        post = await Post.findOneAndUpdate({'_id':req.params.postId},{ $push:{ "reactions": reaction } },)
      }
      return res.status(200).send({'_id':post._id});
    }

  } catch (err){
    return res.status(500).json({error:errorHandler.getErrorMessage(err)})
  }

}

/**
 * @desc Remove reaction
 * @param Object   req - HTTP request object
 * @param Object   res - HTTP response object
 */
const removeReaction = async (req,res) => {
  try {
    let post = await Post.findOneAndUpdate(
      {'_id':req.params.postId,'reactions.postedBy':req.auth._id},
      { $pull: {"reactions":{"postedBy":req.auth._id} }},
      {runValidators:true,new:true});// update their account
    if (post){
      return res.status(200).send({'_id':post._id});
    } else {
      return res.status(404).send({error:StaticStrings.PostModelErrors.NoReactionToDelete});
    }
  } catch (err){
    return res.status(500).json({error:errorHandler.getErrorMessage(err)})
  }

}

export default {
  postByID,
  getPost,
  listPosts,
  createPost,
  editPost,
  deletePost,
  listComments,
  getComment,
  createComment,
  deleteComment,
  getReaction,
  changeReaction,
  ReactionTypes,
  removeReaction
}