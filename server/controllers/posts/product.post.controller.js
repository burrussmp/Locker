/* eslint-disable max-len */
'use strict';

// imports
import Product from '@server/models/product.model';
import Post from '@server/models/post.model';

import StaticStrings from '@config/StaticStrings';
import ErrorHandler from '@server/services/error.handler';

/**
 * @desc Filter a product post
 * @param {object} productPost The product post to filter
 */
const filterProductPost = (productPost) => {
  productPost.content.__v = undefined;
  return productPost;
}

/**
 * @desc Fetch a product post by the product ID.
 * @param {Request} req HTTP request object
 * @param {Response} res HTTP response object
 * @param {string} productID The product ID
 * @return {Promise<Response>} Returns the created post
*/
const fetchbyProductID = async (req, res, productID) => {
  let post;
  try {
    post = await Post.findOne({content: productID})
    .select('contentType content caption tags postedBy postedByType createdAt updatedAt')
    .populate({
      path: 'content',
      populate: {
          path: 'media additional_media',
          select: '-_id key blurhash mimetype',
      },
    })
    .exec();
  } catch (err) {
    return res.status(400).json({error: error.handler.getErrorMessage(err)});
  }
  if (!post) {
    return res.status(404).json({error: `Post unable to be find with query 'product=${productID}'`});
  }
  return res.status(200).json(filterProductPost(post)); 
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
  try {
    const postData = {
      contentType: 'Product',
      content: req.body.product,
      postedBy: req.auth._id,
      postedByType: res.locals.cognitoPoolType,
      caption: req.body.caption,
      tags: req.body.tags,
    };
    let newPost = new Post(postData);
    newPost = await newPost.save();
    return res.status(200).json({'_id': newPost._id});
  } catch (err) {
      res.status(400).json({error: ErrorHandler.getErrorMessage(err)});
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
    const post = await Post.findById(req.params.postId)
      .select('contentType content caption tags postedBy postedByType createdAt updatedAt')
      .populate({
        path: 'content',
        populate: {
            path: 'media additional_media',
            select: '-_id key blurhash mimetype',
        },
      })
      .exec();
    return res.status(200).json(filterProductPost(post));
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
    return res.status(400).json({error: ErrorHandler.getErrorMessage(err)});
  }
};


export default {
  createProductPost,
  fetchbyProductID,
  getProductPost,
  editProductPost,
};
