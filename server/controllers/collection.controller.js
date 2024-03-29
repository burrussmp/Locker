/* eslint-disable no-shadow */
/* eslint-disable no-underscore-dangle */
/* eslint-disable max-len */

// imports

import Collection from '@server/models/collection.model';
import Media from '@server/models/media.model';

import Validator from '@server/services/validator';
import CollectionServices from '@server/services/database/collection.services';
import S3Services from '@server/services/s3';

import ErrorHandler from '@server/services/error.handler';
import StaticStrings from '@config/StaticStrings';

const { CollectionControllerErrors } = StaticStrings;

/**
 * @desc Filter a collection  return public information
 * @param {object} collection The Mongoose information of an collection model
 * @return {object} A filtered organization
 */
const filterCollection = (collection) => {
  const filteredCollection = JSON.parse(JSON.stringify(collection));
  filteredCollection.__v = undefined;
  return filteredCollection;
};

/**
 * @desc Enforce request and collection are part of the same organization
 * @param {Request} req HTTP request object
 * @param {Response} res HTTP response object
 * @param {Function} next Next express middleware function
 * @return {Promise<Response>} Sends the HTTP response or continues
 * to next middleware. A 401 is sent if requester not in the same organization and does
 * not have admin privilege
 */
const enforceSameOrganization = async (req, res, next) => {
  if (req.auth.level !== 0 && req.collection.organization.toString() !== req.auth.organization.toString()) {
    return res.status(401).json({ error: StaticStrings.EmployeeControllerErrors.RequireAdminOrRequesterInOrg });
  }
  return next();
};

/**
 * @desc Middleware to parse url parameter :collectionId
 * @param {Request} req HTTP request object
 * @param {Response} res HTTP response object
 * @param {Function} next Next express middleware function
 * @param {Number} id The ID of the collection
 * @return {Promise<Response>}
 */
const collectionByID = async (req, res, next, id) => {
  try {
    const collection = await Collection.findById(id)
      .populate('hero', 'key blurhash mimetype')
      .exec();
    if (!collection) {
      return res.status(404).json({ error: CollectionControllerErrors.NotFoundError });
    }
    req.collection = collection;
    return next();
  } catch (err) {
    return res.status(404).json({ error: CollectionControllerErrors.NotFoundError });
  }
};

/**
 * @desc Creates a new collection.
 * @param {Request} req HTTP request object
 * @param {Response} res HTTP response object
 * @return {Promise<Response>}
 */
const create = async (req, res) => {
  const mediaMeta = {
    type: 'Collection',
    uploadedBy: req.auth._id,
    uploadedByType: 'Employee',
    fields: [
      {
        name: 'hero', maxCount: 1, mimeTypesAllowed: ['image/png', 'image/jpeg'], required: false,
      },
    ],
  };
  return S3Services.uploadFilesToS3(req, res, mediaMeta, async (req, res, allImages) => {
    const collectionData = {
      name: req.body.name,
      organization: req.body.organization,
      hero: allImages.hero.length !== 0 ? allImages.hero[0]._id : undefined,
      product_list: req.body.product_list,
      description: req.body.description,
      visible: true,
      tags: req.body.tags,
    };
    try {
      const newCollection = new Collection(collectionData);
      if (req.auth.level !== 0 && req.body.organization && req.auth.organization.toString() !== req.body.organization) {
        return res.status(401).json({ error: StaticStrings.EmployeeControllerErrors.RequireAdminOrRequesterInOrg });
      }
      await newCollection.save();
      return res.status(200).json({ _id: newCollection._id });
    } catch (err) {
      try {
        if (allImages.hero.length !== 0) {
          await (await Media.findById(allImages.hero[0]._id)).deleteOne();
        }
        return res.status(400).json({ error: ErrorHandler.getErrorMessage(err) });
      } catch (err2) {
        const errMessage = `Server Error: Unable to create collection because ${err.message} and failed to clean s3 because ${err2.message}`;
        return res.status(500).json({ error: errMessage });
      }
    }
  });
};

/**
 * @desc Retrieve a collection.
 * @param {Request} req HTTP request object
 * @param {Response} res HTTP response object
 * @return {Promise<Response>}
 */
const read = (req, res) => {
  try {
    return res.status(200).json(filterCollection(req.collection));
  } catch (err) {
    return res.status(500).json({
      error: ErrorHandler.getErrorMessage(err),
    });
  }
};

/**
 * @desc List off collections with a query builder
 * @param {Request} req HTTP request object
 * @param {Response} res HTTP response object
 * @return {Promise<Response>}
 */
const list = async (req, res) => {
  const query = CollectionServices.queryBuilder(req);
  try {
    const collections = await Collection.find(query, null).select('_id createdAt');
    return res.json(collections);
  } catch (err) {
    return res.status(500).json({
      error: ErrorHandler.getErrorMessage(err),
    });
  }
};

/**
 * @desc Update a collection
 * @param {Request} req HTTP request object
 * @param {Response} res HTTP response object
 * @return {Promise<Response>}
 */
const update = async (req, res) => Validator.validateUpdateFields(req, res, ['name', 'description', 'product_list', 'tags', 'visible'], async (req, res) => {
  const mediaMeta = {
    type: 'Collection',
    uploadedBy: req.auth._id,
    uploadedByType: 'Employee',
    fields: [
      {
        name: 'hero', maxCount: 1, mimeTypesAllowed: ['image/png', 'image/jpeg'], required: false,
      },
    ],
  };
  return S3Services.uploadFilesToS3(req, res, mediaMeta, async (req, res, allImages) => {
    if (allImages.hero.length !== 0) {
      req.body.hero = allImages.hero[0]._id;
    }
    try {
      const collection = await Collection.findOneAndUpdate({ _id: req.params.collectionId }, req.body, { new: true, runValidators: true });
      if (!collection) return res.status(500).json({ error: StaticStrings.UnknownServerError }); // possibly unable to fetch
      return res.status(200).json(filterCollection(collection));
    } catch (err) {
      if (allImages.hero.length !== 0) {
        try {
          await (await Media.findById(allImages.hero[0]._id)).deleteOne();
        } catch (err2) {
          return res.status(500).json({
            error: `${StaticStrings.UnknownServerError}: Error updating collection and unable to remove
            image that was created due to ${err2}. Original error ${err}.`,
          });
        }
      }
      const errMessage = ErrorHandler.getErrorMessage(err);
      return res.status(400).json({ error: errMessage || err.message });
    }
  });
});

/**
 * @desc Delete a collection
 * @param {Request} req HTTP request object
 * @param {Response} res HTTP response object
 * @return {Promise<Response>}
 */
const remove = async (req, res) => {
  try {
    const deletedCollection = await req.collection.deleteOne();
    return res.json(deletedCollection);
  } catch (err) {
    return res.status(500).json({ error: ErrorHandler.getErrorMessage(err) });
  }
};

export default {
  list,
  create,
  read,
  update,
  remove,
  collectionByID,
  enforceSameOrganization,
};
