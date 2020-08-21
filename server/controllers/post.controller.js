
"use strict";

// imports
import Post from '../models/post.model'
import StaticStrings from '../../config/StaticStrings';
import errorHandler from '../services/dbErrorHandler'
import fs from 'fs'

import contentPostCtrl from '../controllers/content.post.controller';

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
  * @param String   id    - The ID of the post extracted from URL 
*/ 
const postByID = async (req,res,next,id) => {
  try {
    let post = await Post.findById(id)
      .populate('content')
      .populate('postedBy', 'username profile_photo')
      .populate('comments','postedBy text')
      .populate('profile_photo','_id key mimetype')
      .exec()
    post.postedBy.profile_photo = await post.postedBy.profile_photo.populate('key mimetype').exec();
    post.comments.postedBy = await post.comments.postedBy.populate('username').exec();

    if (!post) return res.status('404').json({error: StaticStrings.PostModelErrors.PostNotFoundError})
    req.post = post
    req.owner = id;
    next()
  } catch (err) {
    return res.status('404').json({error: StaticStrings.PostModelErrors.PostNotFoundError})
  }
}


/**
 * @desc List all the posts (just id and who uploaded them)
 * @param Object   req - HTTP request object
 * @param Object   res - HTTP response object
 * @return A list of all the posts by their ID and when they were posted
 */
const listPosts = (req,res) => {
  return res.status(501).json({error:StaticStrings.NotImplementedError})
}

/**
 * @desc Create a post. The fields that are required in the body is the
 * the type of content to be created and then depending on the content what is next.
 * This function should delegate the creation based on the type field
 * @param Object   req - HTTP request object
 * @param Object   res - HTTP response object
 * @return Creates a post
 */
const createPost = (req,res) => {
  if (!req.body.type){
    return res.status(400).json({error:StaticStrings.PostModelErrors.CreateMissingType})
  }
  if (req.body.type == 'content'){
    return contentPostCtrl.createPost(req,res)
  }
  return res.status(501).json({error:StaticStrings.NotImplementedError})
}

/**
 * @desc Gets a post by a particular ID. Delegates this to the type. All posts will return who uploaded it
 * including their profile photo and username, the last update and creation time, reactions, descriptions, comments,
 * tags. For the comments, only the username and text is retrieved.
 * @param Object   req - HTTP request object
 * @param Object   res - HTTP response object
 * @return Creates a post
 */
const getPost = (req,res) => {
  let type = undefined; // find the type by querying post
  if (type == 'content'){
    return contentPostCtrl.getPost(req,res)
  }
  return res.status(501).json({error:StaticStrings.NotImplementedError})
}


/**
 * @desc Edit a post. This delegates editing to the particular type of post
 * @param Object   req - HTTP request object
 * @param Object   res - HTTP response object
 * @return Creates a post
 */
const editPost = (req,res) => {
  let type = undefined; // find the type by querying post
  if (type == 'content'){
    return contentPostCtrl.editPost(req,res)
  }
  return res.status(501).json({error:StaticStrings.NotImplementedError})
}

/**
 * @desc Delegates deletion to type of post
 * @param Object   req - HTTP request object
 * @param Object   res - HTTP response object
 */
const deletePost = (req,res) => {
  let type = undefined; // find the type by querying post
  if (type == 'content'){
    return contentPostCtrl.deletePost(req,res)
  }
  return res.status(501).json({error:StaticStrings.NotImplementedError})
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

// const create = (req, res, next) => {
//   let form = new formidable.IncomingForm()
//   form.keepExtensions = true
//   form.parse(req, async (err, fields, files) => {
//     if (err) {
//       return res.status(400).json({
//         error: "Image could not be uploaded"
//       })
//     }
//     let post = new Post(fields)
//     post.postedBy= req.profile
//     if(files.photo){
//       post.photo.data = fs.readFileSync(files.photo.path)
//       post.photo.contentType = files.photo.type
//     }
//     try {
//       let result = await post.save()
//       res.json(result)
//     }catch (err){
//       return res.status(400).json({
//         error: errorHandler.getErrorMessage(err)
//       })
//     }
//   })
// }

// const postByID = async (req, res, next, id) => {
//   try{
//     let post = await Post.findById(id).populate('postedBy', '_id name').exec()
//     if (!post)
//       return res.status('400').json({
//         error: "Post not found"
//       })
//     req.post = post
//     next()
//   }catch(err){
//     return res.status('400').json({
//       error: "Could not retrieve use post"
//     })
//   }
// }

// const listByUser = async (req, res) => {
//   try{
//     let posts = await Post.find({postedBy: req.profile._id})
//                           .populate('comments.postedBy', '_id name')
//                           .populate('postedBy', '_id name')
//                           .sort('-createdAt')
//                           .exec()
//     res.json(posts)
//   }catch(err){
//     return res.status(400).json({
//       error: errorHandler.getErrorMessage(err)
//     })
//   }
// }

// const listNewsFeed = async (req, res) => {
//   let following = req.profile.following
//   following.push(req.profile._id)
//   try{
//     let posts = await Post.find({postedBy: { $in : req.profile.following } })
//                           .populate('comments.postedBy', '_id name')
//                           .populate('postedBy', '_id name')
//                           .sort('-createdAt')
//                           .exec()
//     res.json(posts)
//   }catch(err){
//     return res.status(400).json({
//       error: errorHandler.getErrorMessage(err)
//     })
//   }
// }

// const remove = async (req, res) => {
//   let post = req.post
//   try{
//     let deletedPost = await post.remove()
//     res.json(deletedPost)
//   }catch(err){
//     return res.status(400).json({
//       error: errorHandler.getErrorMessage(err)
//     })
//   }
// }

// const photo = (req, res, next) => {
//     res.set("Content-Type", req.post.photo.contentType)
//     return res.send(req.post.photo.data)
// }

// const like = async (req, res) => {
//   try{
//     let result = await Post.findByIdAndUpdate(req.body.postId, {$push: {likes: req.body.userId}}, {new: true})
//     res.json(result)
//   }catch(err){
//       return res.status(400).json({
//         error: errorHandler.getErrorMessage(err)
//       })
//   }
// }

// const unlike = async (req, res) => {
//   try{
//     let result = await Post.findByIdAndUpdate(req.body.postId, {$pull: {likes: req.body.userId}}, {new: true})
//     res.json(result)
//   }catch(err){
//     return res.status(400).json({
//       error: errorHandler.getErrorMessage(err)
//     })
//   }
// }

// const comment = async (req, res) => {
//   let comment = req.body.comment
//   comment.postedBy = req.body.userId
//   try{
//     let result = await Post.findByIdAndUpdate(req.body.postId, {$push: {comments: comment}}, {new: true})
//                             .populate('comments.postedBy', '_id name')
//                             .populate('postedBy', '_id name')
//                             .exec()
//     res.json(result)
//   }catch(err){
//     return res.status(400).json({
//       error: errorHandler.getErrorMessage(err)
//     })
//   }
// }
// const uncomment = async (req, res) => {
//   let comment = req.body.comment
//   try{
//     let result = await Post.findByIdAndUpdate(req.body.postId, {$pull: {comments: {_id: comment._id}}}, {new: true})
//                           .populate('comments.postedBy', '_id name')
//                           .populate('postedBy', '_id name')
//                           .exec()
//     res.json(result)
//   }catch(err){
//     return res.status(400).json({
//       error: errorHandler.getErrorMessage(err)
//     })
//   }
// }

// const isPoster = (req, res, next) => {
//   let isPoster = req.post && req.auth && req.post.postedBy._id == req.auth._id
//   if(!isPoster){
//     return res.status('403').json({
//       error: "User is not authorized"
//     })
//   }
//   next()
// }
