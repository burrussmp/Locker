/* eslint-disable max-len */
'use strict';

// imports
import s3Services from '../S3.services';
import ContentPost from '../../models/posts/content.post.model';
import Post from '../../models/post.model';
import errorHandler from '../dbErrorHandler';
import StaticStrings from '../../../config/StaticStrings';


/**
 * @desc Fetches all (or specified) content posts
 * @param {String | undefined} postId If defined, retrieve specific post else retrieve all posts
 * @return {Promise<Response>} Returns a single post or list of posts
*/
const fetchPosts = async (postId=undefined) => {
  if (postId) {
    return Post.findById(postId);
  } else {
    return Post.find().select('_id createdAt');
  }
};


/**
 * @desc Creates a new content post.
 * @param {Request} req HTTP request object
 * @param {Response} res HTTP response object
 * @return {Promise<Response>} Returns the created post
*/
const createContentPost = async (req, res) => {
  const type = 'ContentPost';
  const mediaMeta = {
    'type': type,
    'uploadedBy': req.auth._id,
    'uploadedByType': 'employee',
    'fields': [
      {name: 'media', maxCount: 1, mimetypesAllowed: ['image/png', 'image/jpeg'], required: true},
    ],
  };
  s3Services.uploadFilesToS3(req, res, mediaMeta, async (req, res, allImages)=>{
    let contentPost;
    const media = allImages['media'][0];
    try {
      contentPost = new ContentPost({
        price: req.body.price,
        media: media._id,
      });
      contentPost = await contentPost.save();
    } catch (err) {
      return s3Services.deleteMediaS3(req.file.key).then(()=>{
        return res.status(400).json({error: errorHandler.getErrorMessage(err)});
      }).catch((err2)=>{
        return res.status(500).json({error: 'Posting Server Error: Unable to create content for post and failed to clean s3 ' +
                ' because ' + err.message + ' and '+ err2.message});
      });
    }
    try {
      const postData = {
        type: type,
        content: contentPost._id,
        postedBy: req.auth._id,
        caption: 'caption' in req.body ? req.body.caption : '',
        tags: 'tags' in req.body ? req.body.tags.split(',').filter((s)=>Boolean(s.trim())) : [],
      };
      let newPost = new Post(postData);
      newPost = await newPost.save();
      return res.status(200).json({'_id': newPost._id});
    } catch (err) {
      await contentPost.deleteOne();
      return s3Services.deleteMediaS3(req.file.key).then(()=>{
        return res.status(400).json({error: errorHandler.getErrorMessage(err)});
      }).catch((err2)=>{
        return res.status(500).json({error: 'Posting Server Error: Unable to clean post, cleaned created content, but failed to clean s3' +
                ' because ' + err.message + ' and '+ err2.message});
      });
    }
  });
};


/**
 * @desc Appropriately selects and populates fields of a post
 * @param {Request} req HTTP request object
 * @param {Response} res HTTP response object
 * @return {Promise<Response>} Returns the retrieved post
*/
const getContentPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId).select('type caption tags postedBy createdAt updatedAt')
        .populate({
          path: 'postedBy',
          select: '_id username profile_photo',
          populate: {
            path: 'profile_photo',
            select: '-_id key mimetype blurhash',
          },
        })
        .populate({
          path: 'content',
          select: '-_id price media',
          populate: {
            path: 'media',
            select: '-_id key mimetype blurhash',
          },
        }).exec();
    return res.status(200).json(post);
  } catch (err) {
    return res.status(500).json({
      error: StaticStrings.UnknownServerError + '\nReason: ' + err.message,
    });
  }
};


/**
 * @desc Edits a content post (the caption and tags)
 * @param {Request} req HTTP request object
 * @param {Response} res HTTP response object
 * @return {Promise<Response>} A 200 with post ID if success
*/
const editContentPost = async (req, res) => {
  try {
    const update = {};
        'caption' in req.body ? update.caption = req.body.caption : undefined;
        'tags' in req.body ? update.tags = req.body.tags.split(',').filter((s)=>Boolean(s.trim())) : undefined;
        const post = await Post.findByIdAndUpdate(req.params.postId, update, {runValidators: true, new: true});
        return res.status(200).json({'_id': post._id});
  } catch (err) {
    return res.status(400).json({
      error: errorHandler.getErrorMessage(err),
    });
  }
};


export default {
  createContentPost,
  fetchPosts,
  getContentPost,
  editContentPost,
};
