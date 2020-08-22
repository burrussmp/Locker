
"use strict";

// imports
import Post from '../models/post.model'
import StaticStrings from '../../config/StaticStrings';
import errorHandler from '../services/dbErrorHandler'
import contentPostCtrl from '../controllers/content.post.controller';
import ContentPostServices from "../services/database/content.post.services";


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
    console.log(err)
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
 * @desc Gets all the comments from a post. The comments should include the
 * profile photo S3 key, the username, and the text.
 * @param Object   req - HTTP request object
 * @param Object   res - HTTP response object
 */
const listComments = (req,res) => {
  return res.status(501).json({error:StaticStrings.NotImplementedError})
}

/**
 * @desc Retrieves a comment including the profile picture of the person, the text
 * the time it was created and edited, reactions, and replies The whole thing basically.
 * @param Object   req - HTTP request object
 * @param Object   res - HTTP response object
 */
const getComment = (req,res) => {
  return res.status(501).json({error:StaticStrings.NotImplementedError})
}


/**
 * @desc Creates a comment. The required fields are text, filling in postedBy.
 * @param Object   req - HTTP request object
 * @param Object   res - HTTP response object
 */
const createComment = (req,res) => {
  return res.status(501).json({error:StaticStrings.NotImplementedError})
}

/**
 * @desc Deletes comments. No crazy clean up to do
 * @param Object   req - HTTP request object
 * @param Object   res - HTTP response object
 */
const deleteComment = (req,res) => {
  return res.status(501).json({error:StaticStrings.NotImplementedError})
}

/**
 * @desc Edit a comments text only
 * @param Object   req - HTTP request object
 * @param Object   res - HTTP response object
 */
const editComment = (req,res) => {
  return res.status(501).json({error:StaticStrings.NotImplementedError})
}

/**
 * @desc List all reactions of a particular post
 * @param Object   req - HTTP request object
 * @param Object   res - HTTP response object
 */
const getReaction = (req,res) => {
  return res.status(501).json({error:StaticStrings.NotImplementedError})
}

/**
 * @desc Change the reaction. You can react to your own post
 * @param Object   req - HTTP request object
 * @param Object   res - HTTP response object
 */
const changeReaction = (req,res) => {
  return res.status(501).json({error:StaticStrings.NotImplementedError})
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
  editComment,
  deleteComment,
  getReaction,
  changeReaction,
}