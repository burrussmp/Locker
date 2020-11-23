/* eslint-disable new-cap */
/* eslint-disable max-len */

'use strict';

// imports
import Post from '../models/post.model';
import Comment from '../models/comment.model';
import StaticStrings from '../../config/StaticStrings';
import errorHandler from '../services/dbErrorHandler';
import ContentPostServices from '../services/database/content.post.services';
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
 * @param {Request} req HTTP request object
 * @param {Response} res HTTP response object
 * @param {Function} next Next express middleware function
 * @param {Number} id The ID of the post
 * @return {Promise<Response>} Sends the HTTP response or continues
 * to next middleware. A 404 error code is sent if the post is not
 * found.
 */
const postByID = async (req, res, next, id) => {
  try {
    const post = await Post.findById(id);
    if (!post) {
      return res.status('404').json({
        error: StaticStrings.PostModelErrors.PostNotFoundError,
      });
    }
    req.post = post;
    req.owner = post.postedBy.toString();
    next();
  } catch (err) {
    return res.status(404).json({
      error: StaticStrings.PostModelErrors.PostNotFoundError,
    });
  }
};

/**
 * @desc List all the posts (just id and who uploaded them)
 * @param {Request} req HTTP request object
 * @param {Response} res HTTP response object
 * @return {Promise<Response>} A list of all the posts by their ID and when they were posted
 */
const listPosts = async (req, res) => {
  try {
    const posts = await Post.find().select('createdAt');
    return res.status(200).json(posts);
  } catch (err) {
    return res.status(500).json({error: errorHandler.getErrorMessage(err)});
  }
};

/**
 * @desc Create a post based on the query parameter 'type'. Accepted types include 'ContentPost'
 * @param {Request} req HTTP request object
 * @param {Response} res HTTP response object
 * @return {Promise<Response>} Create a new post.
 */
const createPost = async (req, res) => {
  const type = req.query.type;
  if (type == 'ContentPost') {
    return ContentPostServices.createContentPost(req, res);
  } else {
    return res.status(501).json({error: StaticStrings.NotImplementedError});
  }
};

/**
 * @desc Retrieve a post
 * @param {Request} req HTTP request object
 * @param {Response} res HTTP response object
 * @return {Promise<Response>} The retrieved post object
 */
const getPost = async (req, res) => {
  try {
    if (req.post.type == 'ContentPost') {
      return ContentPostServices.getContentPost(req, res);
    } else {
      return res.status(501).json({error: StaticStrings.NotImplementedError});
    }
  } catch (err) {
    return res.status(500).json({error: StaticStrings.UnknownServerError +'\nReason: '+err.message});
  }
};

/**
 * @desc Edit a post. This delegates editing to the particular type of post
 * @param {Request} req HTTP request object
 * @param {Response} res HTTP response object
 * @return {Promise<Response>} The edited post object
 */
const editPost = async (req, res) => {
  try {
    if (req.post.type == 'ContentPost') {
      return ContentPostServices.editContentPost(req, res);
    } else {
      return res.status(501).json({error: StaticStrings.NotImplementedError});
    }
  } catch (err) {
    return res.status(500).json({error: StaticStrings.UnknownServerError +'\nReason: '+err.message});
  }
};

/**
 * @desc Delegates deletion to type of post
 * @param {Request} req HTTP request object
 * @param {Response} res HTTP response object
 * @return {Promise<Response>} Sends 200 with post ID if successfully
 * deleted
 */
const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    await post.deleteOne();
    return res.status(200).send({'_id': post._id});
  } catch (err) {
    return res.status(500).send({error: StaticStrings.UnknownServerError+'\nReason: '+err.message});
  }
};

/**
 * @desc List all comments of a post as well as reaction stats for each comment
 * @param {Request} req HTTP request object
 * @param {Response} res HTTP response object
 * @return {Promise<Response>} Returns a list of comment IDs
 */
const listComments = async (req, res) => {
  try {
    const postId = mongoose.Types.ObjectId(req.params.postId);
    const reqId = mongoose.Types.ObjectId(req.auth._id);
    const pipeline = [
      {'$match': {'_id': postId}},
      {'$lookup': {
        'from': 'comments',
        'foreignField': '_id',
        'localField': 'comments',
        'as': 'comments',
      }},
      {'$project': {'_id': 0, 'comments': '$comments'}},
      {'$unwind': '$comments'},
      {
        '$project': {
          'text': '$comments.text',
          'postedBy': '$comments.postedBy',
          'createdAt': '$comments.createdAt',
          '_id': '$comments._id',
          'likes': {$cond: {if: {$isArray: '$comments.likes'}, then: {$size: '$comments.likes'}, else: 0}},
          'liked': {$cond: {if: {$and: [{$isArray: '$comments.likes'}, {$in: [reqId, '$comments.likes']}]}, then: true, else: false}},
        },
      },
    ];
    const comments = await Post.aggregate(pipeline).exec();
    return res.status(200).json(comments);
  } catch (err) {
    return res.status(500).json({error: errorHandler.getErrorMessage(err)});
  }
};


/**
 * @desc Retrieve a particular comment and its stats from a post
 * @param {Request} req HTTP request object
 * @param {Response} res HTTP response object
 * @return {Promise<Response>} A specific comment from a post
 */
const getComment = async (req, res) => {
  try {
    const commentId = mongoose.Types.ObjectId(req.params.commentId);
    const reqId = mongoose.Types.ObjectId(req.auth._id);
    const comment = await Comment.aggregate([
      {$match: {_id: commentId}},
      {$project: {
        'text': '$text',
        'postedBy': '$postedBy',
        'createdAt': '$createdAt',
        'likes': {$cond: {if: {$isArray: '$likes'}, then: {$size: '$likes'}, else: 0}},
        'liked': {$cond: {if: {$and: [{$isArray: '$likes'}, {$in: [reqId, '$likes']}]}, then: true, else: false}},
      },
      },
    ]);
    return res.status(200).json(comment[0]);
  } catch (err) {
    return res.status(500).json({error: errorHandler.getErrorMessage(err)});
  }
};

/**
 * @desc Creates a comment. The required fields are text, filling in postedBy.
 * @param {Request} req HTTP request object
 * @param {Response} res HTTP response object
 * @return {Promise<Response>} If successful return the ID of the new comment
 */
const createComment = async (req, res) => {
  try {
    const commentData = {
      text: req.body.text,
      postedBy: req.auth._id,
      postId: req.params.postId,
    };
    let newComment = new Comment(commentData);
    newComment = await newComment.save();
    try {
      await Post.findOneAndUpdate(
          {'_id': req.params.postId},
          {$push: {comments: newComment._id}},
          {runValidators: true});
      return res.status(200).json({'_id': newComment._id});
    } catch (err) {
      return res.status(400).json({error: errorHandler.getErrorMessage(err)});
    }
  } catch (err) {
    return res.status(400).json({error: errorHandler.getErrorMessage(err)});
  }
};

/**
 * @desc Delete a comment (ID retrieved from URL path parameter)
 * @param {Request} req HTTP request object
 * @param {Response} res HTTP response object
 * @return {Promise<Response>} If successful return the ID of deleted comment
 */
const deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    await comment.deleteOne();
    return res.status(200).json({'_id': comment._id});
  } catch (err) {
    return res.status(400).json({error: errorHandler.getErrorMessage(err)});
  }
};

/**
 * @desc List all reactions of a particular post
 * @param {Request} req HTTP request object
 * @param {Response} res HTTP response object
 * @return {Promise<Response>} Aggregate result of reactions if successful
 */
const getReaction = async (req, res) => {
  try {
    const postId = mongoose.Types.ObjectId(req.params.postId);
    const reqId = mongoose.Types.ObjectId(req.auth._id);
    const reactions = await Post.aggregate([
      {$match: {'_id': postId}},
      {$unwind: '$reactions'},
      {$group: {
        '_id': '$reactions.type',
        'total': {$sum: 1},
        'selected': {$max: {$eq: ['$reactions.postedBy', reqId]}}},
      },
    ]);
    const reactionData = Object.assign({selected: false}, ...Object.entries({...ReactionTypes}).map(([a, b]) => ({[b]: 0})));
    for (const reaction of reactions) {
      reactionData[reaction._id] = reaction.total;
      if (reaction.selected) reactionData.selected=reaction._id;
    }
    return res.status(200).json(reactionData);
  } catch (err) {
    return res.status(500).json({error: errorHandler.getErrorMessage(err)});
  }
};

/**
 * @desc Change the reaction. You can react to your own post
 * @param {Request} req HTTP request object
 * @param {Response} res HTTP response object
 * @return {Promise<Response>} The ID of the post whose reaction has been
 * adjusted for a user
 */
const changeReaction = async (req, res) => {
  try {
    if (!ReactionTypes.includes(req.body.reaction)) {
      return res.status(400).json({error: StaticStrings.PostModelErrors.InvalidReaction});
    } else {
      const reaction = {
        type: req.body.reaction,
        postedBy: req.auth._id,
      };
      let post = await Post.findOne({'_id': req.params.postId, 'reactions.postedBy': req.auth._id});
      if (post) {
        post = await Post.findOneAndUpdate({'_id': req.params.postId, 'reactions.postedBy': req.auth._id}, {$set: {'reactions.$.type': reaction.type}});
      } else {
        post = await Post.findOneAndUpdate({'_id': req.params.postId}, {$push: {'reactions': reaction}});
      }
      return res.status(200).send({'_id': post._id});
    }
  } catch (err) {
    return res.status(500).json({error: errorHandler.getErrorMessage(err)});
  }
};

/**
 * @desc Remove your reaction from a post
 * @param {Request} req HTTP request object
 * @param {Response} res HTTP response object
 * @return {Promise<Response>} The ID of the post whose reaction has
 * been removed for a particular user
 */
const removeReaction = async (req, res) => {
  try {
    const post = await Post.findOneAndUpdate(
        {'_id': req.params.postId, 'reactions.postedBy': req.auth._id},
        {$pull: {'reactions': {'postedBy': req.auth._id}}},
        {runValidators: true, new: true});// update their account
    if (post) {
      return res.status(200).send({'_id': post._id});
    } else {
      return res.status(404).send({error: StaticStrings.PostModelErrors.NoReactionToDelete});
    }
  } catch (err) {
    return res.status(500).json({error: errorHandler.getErrorMessage(err)});
  }
};

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
  removeReaction,
};
