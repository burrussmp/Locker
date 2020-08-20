"use strict";

// imports
import Post from '../models/post.model'
import StaticStrings from '../../config/StaticStrings';

/**
 * @desc Retrieves the price, description, tags, reactions
 * @param Object   req - HTTP request object
 * @param Object   res - HTTP response object
 * @return Creates a post
 */
const getPost = (req,res) => {
    return res.status(501).json({error:StaticStrings.NotImplementedError})
  }


/**
 * @desc Creates a content post. This requires created a ContentPostSchema which needs
 * also requires a media and price. So first, create a media, then create a content post, then properly set the
 * id of the new Post to the ContentPost ID. In addition, look for description and tags.
 * @param Object   req - HTTP request object
 * @param Object   res - HTTP response object
 * @return Creates a post
 */
const createPost = (req,res) => {
    return res.status(501).json({error:StaticStrings.NotImplementedError})
}

/**
 * @desc Edits a content post: the price, description, tags, and media can change
 * If the media changes, includes cleaning up Mongo and S3
 * @param Object   req - HTTP request object
 * @param Object   res - HTTP response object
 * @return Creates a post
 */
const editPost = (req,res) => {
    return res.status(501).json({error:StaticStrings.NotImplementedError})
}

/**
 * @desc Removes post permanently, including deleting any comments, any replies, and removing
 * the media from S3
 * @param Object   req - HTTP request object
 * @param Object   res - HTTP response object
 */
const deletePost = (req,res) => {
    let type = undefined; // find the type by querying post
    return res.status(501).json({error:StaticStrings.NotImplementedError})
}


export default {
    getPost,
    createPost,
    editPost,
    deletePost
}