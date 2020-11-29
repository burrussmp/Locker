/* eslint-disable max-len */
'use strict';
// imports
import Media from '../models/media.model';
import Product from '../models/product.model';
import errorHandler from '../services/dbErrorHandler';
import StaticStrings from '../../config/StaticStrings';
import _ from 'lodash';
import S3Services from '../services/S3.services';
import dbErrorHandler from '../services/dbErrorHandler';
import ProductServices from '../services/database/product.services';

const ProductControllerErrors = StaticStrings.ProductControllerErrors;

/**
 * @desc Filter a product to return public information
 * @param {object} product The Mongoose information of an product model
 * @return {object} A filtered organization
 */
const filterProduct = (product) => {
  product.__v = undefined;
  return product;
};

/**
 * @desc Enforce request and product part of same organization or admin
 * @param {Request} req HTTP request object
 * @param {Response} res HTTP response object
 * @param {Function} next Next express middleware function
 * @return {Promise<Response>} Sends the HTTP response or continues
 * to next middleware. A 401 is sent if requester not in the same organization and does
 * not have admin privilege
 */
const enforceSameOrganization = async (req, res, next) => {
  if (req.auth.level != 0 && req.product.organization.toString() != req.auth.organization.toString()) {
    return res.status(401).json({error: StaticStrings.EmployeeControllerErrors.RequireAdminOrRequesterInOrg});
  } else {
    next();
  }
};

/**
 * @desc Middleware to parse url parameter :productId
 * @param {Request} req HTTP request object
 * @param {Response} res HTTP response object
 * @param {Function} next Next express middleware function
 * @param {Number} id The ID of the organization
 * @return {Promise<Response>} Sends the HTTP response or continues
 * to next middleware. A 404 error code is sent if the product is not
 * found.
 */
const productById = async (req, res, next, id) => {
  try {
    const product = await Product.findById(id)
        .populate('media', 'key blurhash mimetype')
        .populate('all_media', 'key blurhash mimetype')
        .exec();
    if (!product) {
      return res.status(404).json({error: ProductControllerErrors.NotFoundError});
    }
    req.product = product;
    next();
  } catch (err) {
    return res.status(404).json({error: ProductControllerErrors.NotFoundError});
  }
};

/**
 * @desc Creates a new product with information found in the request body
 * @param {Request} req HTTP request object
 * @param {Response} res HTTP response object
 * @return {Promise<Response>}
 */
const create = async (req, res) => {
  const mediaMeta = {
    'type': 'Product',
    'uploadedBy': req.auth._id,
    'uploadedByType': 'employee',
    'fields': [
      {name: 'media', maxCount: 1, mimetypesAllowed: ['image/png', 'image/jpeg'], required: true},
      {name: 'all_media', maxCount: 20, mimetypesAllowed: ['image/png', 'image/jpeg', 'video/mp4'], required: false},
    ],
  };
  return S3Services.uploadFilesToS3(req, res, mediaMeta, async (req, res, allImages) => {
    const media = allImages['media'][0];
    if (req.auth.level != 0 && req.auth.organization.toString() != req.body.organization.toString()) {
      return res.status(401).json({error: StaticStrings.EmployeeControllerErrors.RequireAdminOrRequesterInOrg});
    }
    const productData = {
      name: req.body.name,
      url: req.body.url,
      organization: req.body.organization,
      product_collection: req.body.product_collection,
      price: req.body.price,
      media: media._id,
      all_media: allImages['all_media'].map((x)=>x._id),
      description: req.body.description,
      available: true,
      sizes: req.body.sizes,
      tags: req.body.tags,
      meta: ProductServices.deserializeAttr(req.body.meta, 'meta'),
      last_scraped: Date.now(),
    };
    try {
      const newProduct = new Product(productData);
      await newProduct.save();
      return res.status(200).json({'_id': newProduct._id});
    } catch (err) {
      try {
        const mediaDoc = await Media.findById(media._id);
        await mediaDoc.deleteOne();
        if (allImages['all_media']) {
          for (const media of allImages['all_media']) {
            const mediaDoc = await Media.findById(media._id);
            await mediaDoc.deleteOne();
          }
        }
        return res.status(400).json({error: dbErrorHandler.getErrorMessage(err)});
      } catch (err2) {
        const errMessage = `Server Error: Unable to create product because ${err.message} and failed to clean s3 because ${err2.message}`;
        return res.status(500).json({error: errMessage});
      }
    }
  });
};

/**
 * @desc Retrieve the information of a single product
 * @param {Request} req HTTP request object
 * @param {Response} res HTTP response object
 * @return {Promise<Response>}
 */
const read = (req, res) => {
  try {
    return res.status(200).json(filterProduct(req.product));
  } catch (err) {
    return res.status(500).json({
      error: errorHandler.getErrorMessage(err),
    });
  }
};

/**
 * @desc List off products (max = 100) with optional queries.
 * @param {Request} req HTTP request object
 * @param {Response} res HTTP response object
 * @return {Promise<Response>}
 */
const list = async (req, res) => {
  const query = ProductServices.queryBuilder(req);
  try {
    const products = await Product.find(query, null, {limit: 100})
        .select('_id updatedAt createdAt');
    return res.json(products);
  } catch (err) {
    return res.status(500).json({
      error: errorHandler.getErrorMessage(err),
    });
  }
};

/**
 * @desc Update a product
 * @param {Request} req HTTP request object
 * @param {Response} res HTTP response object
 * @return {Promise<Response>}
 */
const update = async (req, res) => {
  const fieldsAllowed = [
    'name',
    'url',
    'price',
    'description',
    'available',
    'tags',
    'meta',
    'sizes',
  ];
  const updateFields = Object.keys(req.body);
  const invalidFields = _.difference(updateFields, fieldsAllowed);
  if (invalidFields.length != 0) {
    return res.status(422).json({error: `${StaticStrings.BadRequestInvalidFields} ${invalidFields}`});
  }
  if (req.body.meta) {
    const metaUpdate = ProductServices.deserializeAttr(req.body.meta, 'meta');
    if (metaUpdate) {
      req.body.meta = metaUpdate;
    } else {
      delete req.body.meta;
    }
  }
  try {
    const product = await Product.findOneAndUpdate({'_id': req.params.productId}, req.body, {new: true, runValidators: true});
    if (!product) return res.status(500).json({error: StaticStrings.UnknownServerError}); // possibly unable to fetch
    return res.status(200).json(filterProduct(product));
  } catch (err) {
    const errMessage = errorHandler.getErrorMessage(err);
    return res.status(400).json({error: errMessage ? errMessage : err.message});
  }
};

/**
 * @desc Delete a product
 * @param {Request} req HTTP request object
 * @param {Response} res HTTP response object
 * @return {Promise<Response>}
 */
const remove = async (req, res) => {
  try {
    const deletedProduct = await req.product.deleteOne();
    return res.json(deletedProduct);
  } catch (err) {
    return res.status(500).json({error: errorHandler.getErrorMessage(err)});
  }
};


export default {
  list,
  create,
  read,
  update,
  remove,
  productById,
  enforceSameOrganization,
};
