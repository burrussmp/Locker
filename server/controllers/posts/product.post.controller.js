/* eslint-disable max-len */
'use strict';

// imports
import ProductPost from '../../models/posts/product.post.model';
import Product from '../../models/product.model';
import Post from '../../models/post.model';
import errorHandler from '../../services/dbErrorHandler';
import StaticStrings from '../../../config/StaticStrings';


/**
 * @desc Fetches all (or specified) product posts posts
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
 * @desc Creates a new product post.
 * @param {Request} req HTTP request object
 * @param {Response} res HTTP response object
 * @return {Promise<Response>} Returns the created post
*/
const createProductPost = async (req, res) => {
  try {
    if (!req.body.product) {
      return res.status(400).json({error: `${StaticStrings.MissingRequiredField} 'product'`});
    }
    const product = await Product.findById(req.body.product);
    if (!product) {
      return res.status(404).json({error: StaticStrings.ProductControllerErrors.NotFoundError});
    }
  } catch (err) {
    return res.status(400).json({err: err.message});
  }
  let productPost;
  try {
    productPost = new ProductPost({product: req.body.product});
    productPost = await productPost.save();
  } catch (err) {
    return res.status(400).json({error: dbErrorHandler.getErrorMessage(err)});
  }
  try {
    const postData = {
      contentType: 'ProductPost',
      content: productPost._id,
      postedBy: req.auth._id,
      postedByType: res.locals.cognitoPoolType,
      caption: req.body.caption,
      tags: req.body.tags,
    };
    let newPost = new Post(postData);
    newPost = await newPost.save();
    return res.status(200).json({'_id': newPost._id});
  } catch (err) {
    try {
      await productPost.deleteOne();
      res.status(400).json({error: errorHandler.getErrorMessage(err)});
    } catch (err2) {
      res.status(500).json({error: StaticStrings.UnknownServerError + `.\nUnable to deletee product post because ${err2.message}.\nOriginal error ${err.message}.`});
    }
  }
};


/**
 * @desc Appropriately selects and populates fields of a post
 * @param {Request} req HTTP request object
 * @param {Response} res HTTP response object
 * @return {Promise<Response>} Returns the retrieved post
*/
const getProductPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId).select('type caption tags postedBy postedByType createdAt updatedAt')
        .populate({
          path: 'postedBy',
          select: 'profile_photo',
          populate: {
            path: 'profile_photo',
            select: '-_id key mimetype blurhash',
          },
        })
        .populate({
          path: 'content',
          populate: {
            path: 'product',
            populate: {
              path: 'media all_media',
              select: '-_id key blurhash mimetype',
            },
          },
        })
        .exec();
    return res.status(200).json(post);
  } catch (err) {
    return res.status(500).json({
      error: StaticStrings.UnknownServerError + '\nReason: ' + err.message,
    });
  }
};


/**
 * @desc Edits a product post (the caption and tags)
 * @param {Request} req HTTP request object
 * @param {Response} res HTTP response object
 * @return {Promise<Response>} A 200 with post ID if success
*/
const editProductPost = async (req, res) => {
  try {
    const update = {};
    'caption' in req.body ? update.caption = req.body.caption : undefined;
    'tags' in req.body ? update.tags = req.body.tags : undefined;
    const post = await Post.findByIdAndUpdate(req.params.postId, update, {runValidators: true, new: true});
    return res.status(200).json({'_id': post._id});
  } catch (err) {
    return res.status(400).json({error: errorHandler.getErrorMessage(err)});
  }
};


export default {
  createProductPost,
  fetchPosts,
  getProductPost,
  editProductPost,
};
