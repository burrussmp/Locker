"use strict";
import Comment from '../models/comment.model';
import StaticStrings from '../../config/StaticStrings';

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

    return res.status(501).json({error:StaticStrings.NotImplementedError})
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
        let replies = req.comment.replies;
        return res.status(200).json({
            replies: replies
        });
    } catch (err) {
        return res.status(500).json({error:err.message});
    }
}

/**
 * @desc Retrieve the whole retry by querying a comment and then querying replies
 * @param Object   req - HTTP request object
 * @param Object   res - HTTP response object
 */
const getReply = (req,res) => {
    return res.status(501).json({error:StaticStrings.NotImplementedError})
}

/**
 * @desc Posts a reply to a comment
 * @param Object   req - HTTP request object
 * @param Object   res - HTTP response object
 * @return Posts a reply to a comment and returns the comment
 */
const createReply = (req,res) => {
    return res.status(501).json({error:StaticStrings.NotImplementedError})
}

/**
 * @desc Edit a reply
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
 * @return Permanently remove the reply
 */
const deleteReply = (req,res) => {
    return res.status(501).json({error:StaticStrings.NotImplementedError})
}

/**
 * @desc React to a reply (like or unlike it depending on req.action)
 * @param Object   req - HTTP request object
 * @param Object   res - HTTP response object
 * @return Permanently remove the reply
 */
const reactReply = (req,res) => {
    return res.status(501).json({error:StaticStrings.NotImplementedError})
}

/**
 * @desc React to a comment (like or unlike it depending on req.action)
 * @param Object   req - HTTP request object
 * @param Object   res - HTTP response object
 * @return Permanently remove the reply
 */
const reactComment = (req,res) => {
    return res.status(501).json({error:StaticStrings.NotImplementedError})
}

export default {
    commentByID,
    replyByID,
    getReply,
    listReplies,
    createReply,
    editReply,
    deleteReply,
    reactReply,
    reactComment
}