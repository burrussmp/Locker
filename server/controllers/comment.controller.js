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
        let comment = await Comment.findById(id)
            .populate('postedBy', 'username profile_photo')
            .populate('likes', 'username')
            .exec();
        comment.postedBy.profile_photo = await comment.postedBy.profile_photo.populate('key mimetype').exec();
        if (!comment) return res.status('404').json({
            error: StaticStrings.CommentModelErrors.CommentNotFoundError
        })
        req.comment = comment
        req.owner = id;
        next()
    } catch (err) {
        return res.status('404').json({
            error: StaticStrings.CommentNotFoundError
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
    return res.status(501).json({error:StaticStrings.NotImplementedError})
}

/**
 * @desc Retrieve the reply by ID and sets ownership field of req to the id
 * @param Object   req - HTTP request object
 * @param Object   res - HTTP response object
 * @return A list of replies for a particular comment. For each comment, there is
 * the username, the profile photo S3 key, the text, and when it was created
 */
const listReplies = (req,res) => {
    return res.status(501).json({error:StaticStrings.NotImplementedError})
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

export default {
    commentByID,
    replyByID,
    getReply,
    listReplies,
    createReply,
    editReply,
    deleteReply,
}