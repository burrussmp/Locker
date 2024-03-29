/* eslint-disable max-len */
'use strict';
// imports
import Media from '@server/models/media.model';
import Product from '@server/models/product.model';

import S3Services from '@server/services/s3';
import ProductServices from '@server/services/database/product.services';
import Validator from '@server/services/validator';

import ErrorHandler from '@server/services/error.handler';
import StaticStrings from '@config/StaticStrings';

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
        .populate('additional_media', 'key blurhash mimetype')
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
    'uploadedByType': 'Employee',
    'fields': [
      {name: 'media', maxCount: 1, mimeTypesAllowed: ['image/png', 'image/jpeg'], required: true},
      {name: 'additional_media', maxCount: 20, mimeTypesAllowed: ['image/png', 'image/jpeg', 'video/mp4'], required: false},
    ],
  };
  return S3Services.uploadFilesToS3(req, res, mediaMeta, async (req, res, allImages) => {
    const media = allImages['media'][0];
    const productData = {
      name: req.body.name,
      url: req.body.url,
      organization: req.body.organization,
      product_collection: req.body.product_collection,
      price: req.body.price,
      media: media._id,
      additional_media: allImages['additional_media'].map((x)=>x._id),
      description: req.body.description,
      available: true,
      approved: req.body.approved ? req.body.approved : false,
      sizes: req.body.sizes,
      tags: req.body.tags,
      meta: ProductServices.deserializeAttr(req.body.meta, 'meta'),
      last_scraped: Date.now(),
    };
    try {
      const newProduct = new Product(productData);
      if (req.auth.level != 0 && req.body.organization && req.body.organization && req.auth.organization.toString() != req.body.organization) {
        return res.status(401).json({error: StaticStrings.EmployeeControllerErrors.RequireAdminOrRequesterInOrg});
      }
      await newProduct.save();
      return res.status(200).json({'_id': newProduct._id});
    } catch (err) {
      try {
        await (await Media.findById(media._id)).deleteOne();
        if (allImages['additional_media']) {
          for (const media of allImages['additional_media']) {
            const mediaDoc = await Media.findById(media._id);
            await mediaDoc.deleteOne();
          }
        }
        return res.status(400).json({error: ErrorHandler.getErrorMessage(err)});
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
      error: ErrorHandler.getErrorMessage(err),
    });
  }
};

/**
 * @desc List off products with optional queries.
 * @param {Request} req HTTP request object
 * @param {Response} res HTTP response object
 * @return {Promise<Response>}
 */
const list = async (req, res) => {
  const query = ProductServices.queryBuilder(req);
  try {
    const products = await Product.find(query, null)
        .select('_id updatedAt createdAt');
    return res.json(products);
  } catch (err) {
    return res.status(500).json({
      error: ErrorHandler.getErrorMessage(err),
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
  return Validator.validateUpdateFields(req, res,
    ['name', 'url', 'price', 'description', 'available', 'approved', 'tags', 'meta', 'sizes', 'last_scraped'], async (req, res) => {
    if (req.body.meta) {
      const metaUpdate = ProductServices.deserializeAttr(req.body.meta, 'meta');
      if (metaUpdate) {
        req.body.meta = metaUpdate;
      } else {
        delete req.body.meta;
      }
    }
    if (req.body.last_scraped) {
      try {
        req.body.last_scraped = new Date(req.body.last_scraped * 1000);
      } catch (err) {
        return res.status(400).json({error: `Unable to convert 'last_scraped' unix timestamp to javascript timestamp. Reason ${err.message}`});
      }
    }
    try {
      const product = await Product.findOneAndUpdate({'_id': req.params.productId}, req.body, {new: true, runValidators: true});
      if (!product) return res.status(500).json({error: StaticStrings.UnknownServerError}); // possibly unable to fetch
      return res.status(200).json(filterProduct(product));
    } catch (err) {
      const errMessage = ErrorHandler.getErrorMessage(err);
      return res.status(400).json({error: errMessage ? errMessage : err.message});
    }
  });
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
    return res.status(500).json({error: ErrorHandler.getErrorMessage(err)});
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
