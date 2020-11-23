/* eslint-disable max-len */
'use strict';
import Comment from '../models/comment.model';
import StaticStrings from '../../config/StaticStrings';
import CommentServices from '../services/database/comments.services';
import errorHandler from '../services/dbErrorHandler';


/**
 * @desc Retrieve the comment by ID and sets ownership field of req to the id
 * @param {Request} req HTTP request object
 * @param {Response} res HTTP response object
 * @param {Function} next The next middleware to call
 * @param {Number} id The url path param
 * @return {Promise<Response>} The updated employee JSON
 */
const commentByID = async (req, res, next, id) => {
  try {
    const comment = await Comment.findById({'_id': id});
    if (!comment) {
      return res.status('404').json({
        error: StaticStrings.CommentModelErrors.CommentNotFoundError,
      });
    }
    req.comment = comment;
    req.owner = comment.postedBy.toString();
    next();
  } catch (err) {
    return res.status(404).json({
      error: StaticStrings.CommentModelErrors.CommentNotFoundError,
    });
  }
};

/**
 * @desc Retrieve the reply by ID and sets ownership field of req to the id
 * @param {Request} req HTTP request object
 * @param {Response} res HTTP response object
 * @param {Function} next The next middleware to call
 * @param {Number} id The url path param
 * @return {Promise<Response>} The updated employee JSON
 */
const replyByID = async (req, res, next, id) => {
  if (!req.comment._id) {
    return res.status(500).json({error: StaticStrings.UnknownServerError});
  }
  try {
    const reply = req.comment.replies.id(id);
    if (!reply) {
      return res.status('404').json({
        error: StaticStrings.CommentModelErrors.ReplyNotFound,
      });
    }
    req.reply = reply;
    req.owner = reply.postedBy.toString();
    next();
  } catch (err) {
    return res.status(404).json({
      error: StaticStrings.CommentModelErrors.ReplyNotFound,
    });
  }
};


/**
 * @desc Get all replies for a comment
 * @param {Request} req HTTP request object
 * @param {Response} res HTTP response object
 * @return {Promise<Response>} A list of replies for a particular comment.
 * For each comment, there is the username, the profile photo S3 key, the
 * text, and when it was created
 */
const listReplies = async (req, res) => {
  try {
    const replies = await CommentServices.fetchReplies(req.params.commentId, req.auth._id);
    return res.status(200).json(replies);
  } catch (err) {
    return res.status(500).json({error: err.message});
  }
};


/**
 * @desc Get a reply by it's ID
 * @param {Request} req HTTP request object
 * @param {Response} res HTTP response object
 * @return {Promise<Response>} Return the reply document
 */
const getReply = async (req, res) => {
  try {
    const replies = await CommentServices.fetchReplies(req.params.commentId, req.auth._id, req.params.replyId);
    return res.status(200).json(replies[0]);
  } catch (err) {
    return res.status(404).json({error: StaticStrings.CommentModelErrors.ReplyNotFound});
  }
};


/**
 * @desc Posts a reply to a comment
 * @param {Request} req HTTP request object
 * @param {Response} res HTTP response object
 * @return {Promise<Response>} Posts a reply to a comment and returns the comment
 */
const createReply = async (req, res) => {
  const reply = {
    postedBy: req.auth._id,
    text: req.body.text,
  };
  try {
    const newReply = await CommentServices.addReply(req.params.commentId, reply);
    return res.status(200).json({'_id': newReply._id});
  } catch (err) {
    if (errorHandler.getErrorMessage(err).includes(StaticStrings.CommentModelErrors.ReplyTextRequired)) {
      return res.status(400).json({error: StaticStrings.CommentModelErrors.ReplyTextRequired});
    } else {
      return res.status(400).json({error: errorHandler.getErrorMessage(err)});
    }
  }
};


/**
 * @desc Edit a reply: Can only modify the text
 * @param {Request} req HTTP request object
 * @param {Response} res HTTP response object
 * @return {Promise<Response>} REturns edited comment
 */
const editReply = async (req, res) => {
  try {
    if (!req.body.text) {
      return res.status(400).json({error: StaticStrings.ReplyControllerErrors.MissingTextField});
    }
    const reply = await CommentServices.editReply(req.params.commentId, req.params.replyId, req.body.text);
    return res.status(200).json(
        {
          '_id': reply._id,
          'text': reply.text,
        },
    );
  } catch (err) {
    if (errorHandler.getErrorMessage(err).includes(StaticStrings.CommentModelErrors.ReplyTextRequired)) {
      return res.status(400).json({error: StaticStrings.CommentModelErrors.ReplyTextRequired});
    } else if (errorHandler.getErrorMessage(err).includes(StaticStrings.CommentModelErrors.MaxCommentSizeError)) {
      return res.status(400).json({error: StaticStrings.CommentModelErrors.MaxCommentSizeError});
    } else {
      return res.status(400).json({error: errorHandler.getErrorMessage(err)});
    }
  }
};

/**
 * @desc Delete a reply
 * @param {Request} req HTTP request object
 * @param {Response} res HTTP response object
 * @return {Promise<Response>} Returns deleted comment
 */
const deleteReply = async (req, res) => {
  try {
    const reply = await CommentServices.deleteReply(req.params.commentId, req.params.replyId);
    return res.status(200).json({'_id': reply._id});
  } catch (err) {
    if (errorHandler.getErrorMessage(err).includes(StaticStrings.CommentModelErrors.ReplyTextRequired)) {
      return res.status(400).json({error: StaticStrings.CommentModelErrors.ReplyTextRequired});
    } else if (errorHandler.getErrorMessage(err).includes(StaticStrings.CommentModelErrors.MaxCommentSizeError)) {
      return res.status(400).json({error: StaticStrings.CommentModelErrors.MaxCommentSizeError});
    } else {
      return res.status(400).json({error: errorHandler.getErrorMessage(err)});
    }
  }
};


/**
 * @desc Like a reply
 * @param {Request} req HTTP request object
 * @param {Response} res HTTP response object
 * @return {Promise<Response>} Returns reply ID
 */
const likeReply = async (req, res) => {
  try {
    const reply = await CommentServices.likeReply(req.params.commentId, req.params.replyId, req.auth._id);
    return res.status(200).json({_id: reply._id});
  } catch (err) {
    return res.status(500).json({error: errorHandler.getErrorMessage(err)});
  }
};

/**
 * @desc Unlike a reply
 * @param {Request} req HTTP request object
 * @param {Response} res HTTP response object
 * @return {Promise<Response>} Returns reply ID
 */
const unlikeReply = async (req, res) => {
  try {
    const reply = await CommentServices.unlikeReply(req.params.commentId, req.params.replyId, req.auth._id);
    return res.status(200).json({_id: reply._id});
  } catch (err) {
    return res.status(500).json({error: errorHandler.getErrorMessage(err)});
  }
};

/**
 * @desc Like a comment
 * @param {Request} req HTTP request object
 * @param {Response} res HTTP response object
 * @return {Promise<Response>} Returns comment ID
 */
const likeComment = async (req, res) => {
  try {
    await CommentServices.likeComment(req.params.commentId, req.auth._id);
    return res.status(200).json({_id: req.params.commentId});
  } catch (err) {
    return res.status(500).json({error: errorHandler.getErrorMessage(err)});
  }
};


/**
 * @desc Unlike a comment
 * @param {Request} req HTTP request object
 * @param {Response} res HTTP response object
 * @return {Promise<Response>} Returns comment ID
 */
const unlikeComment = async (req, res) => {
  try {
    await CommentServices.unlikeComment(req.params.commentId, req.auth._id);
    return res.status(200).json({_id: req.params.commentId});
  } catch (err) {
    return res.status(500).json({error: errorHandler.getErrorMessage(err)});
  }
};

export default {
  commentByID,
  replyByID,
  getReply,
  listReplies,
  createReply,
  editReply,
  deleteReply,
  likeReply,
  unlikeReply,
  likeComment,
  unlikeComment,
};
