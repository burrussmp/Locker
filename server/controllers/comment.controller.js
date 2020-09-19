"use strict";
import Comment from '../models/comment.model';
import StaticStrings from '../../config/StaticStrings';
import Comment_Services from '../services/database/comments.services';
import errorHandler from '../services/dbErrorHandler'

/**
 * @desc Retrieve the comment by ID and sets ownership field of req to the id
 * @param Object   req - HTTP request object
 * @param Object   res - HTTP response object
 * @param Function next - Next express middleware function
 * @param String   id  - The ID of the comment
 */
const commentByID = async (req, res, next, id) => {
    try {
        let comment = await Comment.findById({'_id':id});
        if (!comment) {
            return res.status('404').json({
                error: StaticStrings.CommentModelErrors.CommentNotFoundError
            })
        }
        req.comment = comment
        req.owner = comment.postedBy.toString();
        next()
    } catch (err) {
        return res.status(404).json({
            error: StaticStrings.CommentModelErrors.CommentNotFoundError
        })
    }
}

/**
 * @desc Retrieve the reply by ID and sets ownership field of req to the id
 * @param Object   req - HTTP request object
 * @param Object   res - HTTP response object
 * @param Function next - Next express middleware function
 * @param String   id  - The id of the reply to the comment
 */
const replyByID = async (req, res, next, id) => {
    if (!req.comment._id){
        return res.status(500).json({error:StaticStrings.UnknownServerError});
    }
    try {
        let reply = req.comment.replies.id(id);
        if (!reply) {
            return res.status('404').json({
                error: StaticStrings.CommentModelErrors.ReplyNotFound
            })
        }
        req.reply = reply;
        req.owner = reply.postedBy.toString();
        next();
    } catch (err){
        return res.status(404).json({
            error: StaticStrings.CommentModelErrors.ReplyNotFound
        })
    }
}

/**
 * @desc Get the replies
 * @param Object   req - HTTP request object
 * @param Object   res - HTTP response object
 * @return A list of replies for a particular comment. For each comment, there is
 * the username, the profile photo S3 key, the text, and when it was created
 */
const listReplies = async (req,res) => {
    try {
        let replies = await Comment_Services.fetchReplies(req.params.commentId,req.auth._id);
        return res.status(200).json(replies);
    } catch (err) {
        return res.status(500).json({error:err.message});
    }
}

/**
 * @desc Get a reply by it's ID
 * @param Object   req - HTTP request object
 * @param Object   res - HTTP response object
 */
const getReply = async (req,res) => {
    try {
        let replies = await Comment_Services.fetchReplies(req.params.commentId, req.auth._id, req.params.replyId);
        return res.status(200).json(replies[0]);
    } catch (err) {
        return res.status(404).json({error: StaticStrings.CommentModelErrors.ReplyNotFound});
    }
}

/**
 * @desc Posts a reply to a comment
 * @param Object   req - HTTP request object
 * @param Object   res - HTTP response object
 * @return Posts a reply to a comment and returns the comment
 */
const createReply = async (req,res) => {
    const reply = {
        postedBy: req.auth._id,
        text : req.body.text,
    }
    try {
        let new_reply = await Comment_Services.addReply(req.params.commentId,reply);
        return res.status(200).json({"_id":new_reply._id});
    } catch (err) {
        if (errorHandler.getErrorMessage(err).includes(StaticStrings.CommentModelErrors.ReplyTextRequired))
            return res.status(400).json({error: StaticStrings.CommentModelErrors.ReplyTextRequired}) 
        else
            return res.status(400).json({error: errorHandler.getErrorMessage(err)}) 
    }
}

/**
 * @desc Edit a reply: Can only modify the text
 * @param Object   req - HTTP request object
 * @param Object   res - HTTP response object
 * @return Can only edit the text
 */
const editReply = async (req,res) => {
    try {
        if (!req.body.text){
            return res.status(400).json({error:StaticStrings.ReplyControllerErrors.MissingTextField});
        }
        let reply = await Comment_Services.editReply(req.params.commentId,req.params.replyId,req.body.text);
        return res.status(200).json(
            {
                '_id' : reply._id,
                'text':reply.text
            }
        );
    } catch (err) {
        if (errorHandler.getErrorMessage(err).includes(StaticStrings.CommentModelErrors.ReplyTextRequired))
            return res.status(400).json({error: StaticStrings.CommentModelErrors.ReplyTextRequired}) 
        else if (errorHandler.getErrorMessage(err).includes(StaticStrings.CommentModelErrors.MaxCommentSizeError))
            return res.status(400).json({error: StaticStrings.CommentModelErrors.MaxCommentSizeError})
        else
            return res.status(400).json({error: errorHandler.getErrorMessage(err)}) 
    }}

/**
 * @desc Delete a reply
 * @param Object   req - HTTP request object
 * @param Object   res - HTTP response object
 */
const deleteReply = async (req,res) => {
    try {
        let reply = await Comment_Services.deleteReply(req.params.commentId,req.params.replyId);
        return res.status(200).json({
            '_id' : reply._id
        });
    } catch (err) {
        if (errorHandler.getErrorMessage(err).includes(StaticStrings.CommentModelErrors.ReplyTextRequired))
            return res.status(400).json({error: StaticStrings.CommentModelErrors.ReplyTextRequired}) 
        else if (errorHandler.getErrorMessage(err).includes(StaticStrings.CommentModelErrors.MaxCommentSizeError))
            return res.status(400).json({error: StaticStrings.CommentModelErrors.MaxCommentSizeError})
        else
            return res.status(400).json({error: errorHandler.getErrorMessage(err)}) 
    }
}

/**
 * @desc Like a reply
 * @param Object   req - HTTP request object
 * @param Object   res - HTTP response object
 */
const likeReply = async (req,res) => {
    try {
        let reply = await Comment_Services.likeReply(req.params.commentId,req.params.replyId,req.auth._id);
        return res.status(200).json({_id:reply._id});
    } catch (err){
        return res.status(500).json({error: errorHandler.getErrorMessage(err)})
    }
}

/**
 * @desc Unlike a reply
 * @param Object   req - HTTP request object
 * @param Object   res - HTTP response object
*/
const unlikeReply = async (req,res) => {
    try {
        let reply = await Comment_Services.unlikeReply(req.params.commentId,req.params.replyId,req.auth._id);
        return res.status(200).json({_id : reply._id});
    } catch (err){
        return res.status(500).json({error: errorHandler.getErrorMessage(err)})
    } 
}

/**
 * @desc Like a comment
 * @param Object   req - HTTP request object
 * @param Object   res - HTTP response object
*/
const likeComment = async (req,res) => {
    try {
        await Comment_Services.likeComment(req.params.commentId,req.auth._id);
        return res.status(200).json({message:StaticStrings.LikedCommentSuccess});
    } catch (err){
        return res.status(500).json({error: errorHandler.getErrorMessage(err)})
    } 
}


/**
 * @desc Unlike a comment
 * @param Object   req - HTTP request object
 * @param Object   res - HTTP response object
*/
const unlikeComment = async (req,res) => {
    try {
        await Comment_Services.unlikeComment(req.params.commentId,req.auth._id);
        return res.status(200).json({message:StaticStrings.UnlikedCommentSuccess});
    } catch (err){
        return res.status(500).json({error: errorHandler.getErrorMessage(err)})
    } }

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
    unlikeComment
}