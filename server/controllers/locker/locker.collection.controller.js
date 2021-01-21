/* eslint-disable no-shadow */
/* eslint-disable no-underscore-dangle */
/* eslint-disable max-len */

// imports
import Locker from '@server/models/locker/locker.model';
import LockerCollection from '@server/models/locker/locker.collection.model';
import Media from '@server/models/media.model';

import Validator from '@server/services/validator';
import S3Services from '@server/services/s3';

import ErrorHandler from '@server/services/error.handler';
import StaticStrings from '@config/StaticStrings';

const { LockerCollectionControllerErrors } = StaticStrings;

/**
 * @desc Filter a locker collection and return public information
 * @param {object} lockerCollection The Mongoose information of a locker collection model
 * @return {object} A filtered locker collection
 */
const filterLockerCollection = (lockerCollection) => {
  const filteredLockerCollection = JSON.parse(JSON.stringify(lockerCollection));
  filteredLockerCollection.__v = undefined;
  return filteredLockerCollection;
};

/**
 * @desc Middleware to parse url parameter :lockerCollectionId
 * @param {Request} req HTTP request object
 * @param {Response} res HTTP response object
 * @param {Function} next Next express middleware function
 * @param {Number} id The ID of the locker collection
 * @return {Promise<Response>}
 */
const lockerCollectionById = async (req, res, next, id) => {
  try {
    const lockerCollection = await LockerCollection.findById(id)
      .populate('hero', 'key blurhash mimetype')
      .exec();
    if (!lockerCollection) {
      return res.status(404).json({ error: LockerCollectionControllerErrors.NotFoundError });
    }
    req.lockerCollection = lockerCollection;
    return next();
  } catch (err) {
    return res.status(404).json({ error: LockerCollectionControllerErrors.NotFoundError });
  }
};

/**
 * @desc Creates a new locker collection.
 * @param {Request} req HTTP request object
 * @param {Response} res HTTP response object
 * @return {Promise<Response>}
 */
const create = async (req, res) => {
  const mediaMeta = {
    type: 'LockerCollection',
    uploadedBy: req.auth._id,
    uploadedByType: 'User',
    fields: [
      {
        name: 'hero', maxCount: 1, mimeTypesAllowed: ['image/png', 'image/jpeg'], required: false,
      },
    ],
  };
  return S3Services.uploadFilesToS3(req, res, mediaMeta, async (req, res, allImages) => {
    const lockerCollectionData = {
      name: req.body.name,
      user: req.auth._id.toString(),
      hero: allImages.hero.length !== 0 ? allImages.hero[0]._id : undefined,
      product_list: [],
      description: req.body.description,
    };
    try {
      const newLockerCollection = await (new LockerCollection(lockerCollectionData)).save();
      
      await Locker.findOneAndUpdate({_id: req.locker._id}, {$addToSet: {collections: newLockerCollection._id}});

      return res.status(200).json({ _id: newLockerCollection._id });
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
 * @desc Retrieve all locker collections.
 * @param {Request} req HTTP request object
 * @param {Response} res HTTP response object
 * @return {Promise<Response>}
 */
const read = (req, res) => {
  try {
    return res.status(200).json(filterLockerCollection(req.lockerCollection));
  } catch (err) {
    return res.status(500).json({
      error: ErrorHandler.getErrorMessage(err) || err.message,
    });
  }
};

/**
 * @desc List off locker collections
 * @param {Request} req HTTP request object
 * @param {Response} res HTTP response object
 * @return {Promise<Response>}
 */
const list = async (req, res) => {
  try {
    return res.json(req.locker.collections);
  } catch (err) {
    return res.status(500).json({
      error: ErrorHandler.getErrorMessage(err),
    });
  }
};

/**
 * @desc Update a locker collection
 * @param {Request} req HTTP request object
 * @param {Response} res HTTP response object
 * @return {Promise<Response>}
 */
const update = async (req, res) => Validator.validateUpdateFields(req, res, ['name', 'description'], async (req, res) => {
  const mediaMeta = {
    type: 'LockerCollection',
    uploadedBy: req.auth._id,
    uploadedByType: 'User',
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
      await req.lockerCollection.updateOne(req.body, { runValidators: true });
      return res.status(200).json({_id: req.lockerCollection._id});
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
 * @desc Delete a locker collection
 * @param {Request} req HTTP request object
 * @param {Response} res HTTP response object
 * @return {Promise<Response>}
 */
const remove = async (req, res) => {
  try {
    const deletedDocument = await req.lockerCollection.deleteOne();
    return res.json(deletedDocument);
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
  lockerCollectionById,
};
