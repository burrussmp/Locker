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
        req.owner = comment.postedBy;
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
    req.owner = id;
    next()
}

/**
 * @desc List all the replies of a specific comment
 * @param Object   req - HTTP request object
 * @param Object   res - HTTP response object
 * @return A list of replies for a particular comment. For each comment, there is
 * the username, the profile photo S3 key, the text, and when it was created
 */
const listReplies = async (req,res) => {
    try {
        let replies = await Comment_Services.fetchReplies(req.params.commentId,req.auth._id);
        return res.status(200).json({
            data: replies
        });
    } catch (err) {
        return res.status(500).json({error:err.message});
    }
}

/**
 * @desc Get a reply by it's ID
 * @param Object   req - HTTP request object
 * @param Object   res - HTTP response object
 */
const getReply = (req,res) => {
    try {
        let replies = await Comment_Services.fetchReplies(req.params.commentId,req.auth._id);
        return res.status(200).json({
            data: replies
        });
    } catch (err) {
        return res.status(500).json({error:err.message});
    }}

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
        await Comment_Services.addReply(req.params.commentId,reply)
        return res.status(200).json({message: StaticStrings.AddedReplySuccess});
    } catch (err) {
        if (errorHandler.getErrorMessage(err).includes(StaticStrings.CommentModelErrors.ReplyTextRequired))
            return res.status(400).json({error: StaticStrings.CommentModelErrors.ReplyTextRequired}) 
        else
            return res.status(400).json({error: errorHandler.getErrorMessage(err)}) 
    }
}

/**
 * @desc Edit a reply: can include text and likes
 * @param Object   req - HTTP request object
 * @param Object   res - HTTP response object
 * @return Ccan only edit the text
 */
const editReply = (req,res) => {
    return res.status(501).json({error:StaticStrings.NotImplementedError})
}

/**
 * @desc Delete a reply
 * @param Object   req - HTTP request object
 * @param Object   res - HTTP response object
 */
const deleteReply = (req,res) => {
    return res.status(501).json({error:StaticStrings.NotImplementedError})
}

/**
 * @desc React to a reply (like or unlike it depending on req.action)
 * @param Object   req - HTTP request object
 * @param Object   res - HTTP response object
 */
const likeReply = (req,res) => {
    return res.status(501).json({error:StaticStrings.NotImplementedError})
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
    likeComment,
    unlikeComment
}