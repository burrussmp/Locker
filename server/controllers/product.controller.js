/* eslint-disable max-len */
'use strict';
// imports
import Organization from '../models/organization.model';
import Media from '../models/media.model';
import Employee from '../models/employee.model';
import RBAC from '../models/rbac.model';
import Product from '../models/product.model';
import mediaCtrl from '../controllers/media.controller';
import errorHandler from '../services/dbErrorHandler';
import StaticStrings from '../../config/StaticStrings';
import _ from 'lodash';
import S3Services from '../services/S3.services';
import dbErrorHandler from '../services/dbErrorHandler';

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
      {name: 'all_media', maxCount: 20, mimetypesAllowed: ['image/png', 'image/jpeg'], required: false},
    ],
  };
  return S3Services.uploadFilesToS3(req, res, mediaMeta, async (req, res, allImages) => {
    let tags; let meta; let sizes;
    if (req.body.tags) {
      try {
        tags = req.body.tags.split(',').filter((s)=>Boolean(s.trim()));
      } catch (err) {
        console.log(`Error: Unable to parse product tags.\nTags: ${req.body.tags}.\nReason: ${err}`);
      }
    }
    if (req.body.sizes) {
      try {
        sizes = req.body.sizes.split(',').filter((s)=>Boolean(s.trim()));
      } catch (err) {
        console.log(`Error: Unable to parse product sizes.\Sizes: ${req.body.sizes}.\nReason: ${err}`);
      }
    }
    if (req.body.meta) {
      try {
        meta = JSON.parse(req.body.meta);
      } catch (err) {
        console.log(`Error: Unable to parse product meta.\nMeta: ${req.body.meta}.\nReason: ${err}`);
      }
    }
    const media = allImages['media'][0];
    const productData = {
      name: req.body.name,
      url: req.body.url,
      organization: req.body.organization,
      price: req.body.price,
      media: media._id,
      all_media: allImages['all_media'].map((x)=>x._id),
      description: req.body.description,
      exists: true,
      sizes: sizes,
      tags: tags,
      meta: meta,
    };
    try {
      const newProduct = new Product(productData);
      await newProduct.save();
      return res.status(200).json({'_id': newProduct._id});
    } catch (err) {
      try {
        await s3Services.deleteMediaS3(allImages['media'].key);
        if (allImages['all_media']) {
          for (const media of allImages['all_media']) {
            await s3Services.deleteMediaS3(media.key);
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
 * @desc List off products
 * @param {Request} req HTTP request object
 * @param {Response} res HTTP response object
 * @return {Promise<Response>}
 */
const list = async (req, res) => {
  try {
    const products = await Product.find().select(
        '_id updatedAt createdAt',
    );
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
    'exists',
    'tags',
    'meta',
    'sizes',
  ];
  const updateFields = Object.keys(req.body);
  const invalidFields = _.difference(updateFields, fieldsAllowed);
  if (invalidFields.length != 0) {
    return res.status(422).json({error: `${StaticStrings.BadRequestInvalidFields} ${invalidFields}`});
  }
  try {
    const product = await Product.findOneAndUpdate({'_id': req.params.productId}, req.body, {new: true, runValidators: true});
    if (!product) return res.status(500).json({error: StaticStrings.UnknownServerError}); // possibly unable to fetch
    return res.status(200).json(filterOrganization(product));
  } catch (err) {
    return res.status(400).json({error: errorHandler.getErrorMessage(err)});
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
    return res.status(500).json({
      error: errorHandler.getErrorMessage(err),
    });
  }
};


export default {
  list,
  create,
  read,
  update,
  remove,
  productById,
};
