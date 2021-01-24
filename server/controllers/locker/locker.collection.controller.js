/* eslint-disable no-shadow */
/* eslint-disable no-underscore-dangle */
/* eslint-disable max-len */

// imports
import Product from '@server/models/product.model';
import Locker from '@server/models/locker/locker.model';
import LockerProduct from '@server/models/locker/lockerproduct.model';
import LockerCollection from '@server/models/locker/locker.collection.model';
import Media from '@server/models/media.model';

import Validator from '@server/services/validator';
import AuthCtrl from '@server/controllers/auth.controller';
import LockerServices from '@server/services/database/locker/locker.services';
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
    
    if (!AuthCtrl.isAdmin(req) && req.locker.user.toString() != lockerCollection.user.toString()) {
      return res.status(401).json({error: StaticStrings.LockerCollectionControllerErrors.CollectionAndLockerNotOwnedBySameRequester})
    }

    req.lockerCollection = lockerCollection;
    req.owner = lockerCollection.user;
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
      { name: 'hero', maxCount: 1, mimeTypesAllowed: ['image/png', 'image/jpeg'], required: false},
    ],
  };
  return S3Services.uploadFilesToS3(req, res, mediaMeta, async (req, res, allImages) => {
    const lockerCollectionData = {
      name: req.body.name,
      user: req.auth._id.toString(),
      hero: allImages.hero.length !== 0 ? allImages.hero[0]._id : undefined,
      description: req.body.description,
    };
    try {
      // create and add new collection to locker
      const newLockerCollection = await (new LockerCollection(lockerCollectionData)).save();
      await req.locker.updateOne({$addToSet: {locker_collections: newLockerCollection._id}});
      return res.status(200).json({ _id: newLockerCollection._id });
    } catch (err) {
      try {
        if (allImages.hero.length !== 0) {
          await (await Media.findById(allImages.hero[0]._id)).deleteOne();
        }
        return res.status(400).json({ error: ErrorHandler.getErrorMessage(err) || err.message});
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
    return res.status(500).json({error: ErrorHandler.getErrorMessage(err) || err.message});
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
    return res.json(req.locker.locker_collections);
  } catch (err) {
    return res.status(500).json({error: ErrorHandler.getErrorMessage(err) || err.message});
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
      { name: 'hero', maxCount: 1, mimeTypesAllowed: ['image/png', 'image/jpeg'], required: false },
    ],
  };
  return S3Services.uploadFilesToS3(req, res, mediaMeta, async (req, res, allImages) => {
    if (allImages.hero.length !== 0) {
      req.body.hero = allImages.hero[0]._id;
    }
    try {
      const updatedLockerCollection = await LockerCollection.findOneAndUpdate({_id: req.lockerCollection._id}, req.body, { new: true, runValidators: true })
      .populate('hero', 'key blurhash mimetype')
      .exec();
      return res.status(200).json(filterLockerCollection(updatedLockerCollection));
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
      return res.status(400).json({ error: ErrorHandler.getErrorMessage(err) || err.message });
    }
  });
});

/**
 * @desc Delete a locker collection and remove from associated locker.
 * @param {Request} req HTTP request object
 * @param {Response} res HTTP response object
 * @return {Promise<Response>}
 */
const remove = async (req, res) => {
  try {
    await req.locker.updateOne({$pull: {locker_collections: req.lockerCollection._id}});
    const deletedDocument = await req.lockerCollection.deleteOne();
    return res.json(deletedDocument);
  } catch (err) {
    return res.status(500).json({ error: ErrorHandler.getErrorMessage(err) || err.message });
  }
};

/**
 * @desc Get all products in a locker collection
 * @param {Request} req HTTP request object
 * @param {Response} res HTTP response object
 * @return {Promise<Response>}
 */
const getProducts = async (req, res) => {
  try {
      const allLockerProducts = await LockerProduct.find({locker: req.locker._id, locker_collections: {"$in": [req.lockerCollection._id]}});
      return res.status(200).json(allLockerProducts.map(x=>LockerServices.filterLockerProduct(x)));
  } catch (err) {
      return res.status(500).json({ error: ErrorHandler.getErrorMessage(err) || err.message });
  }
};

/**
 * @desc Add a product to a locker collection and locker (if not already there)
 * @param {Request} req HTTP request object
 * @param {Response} res HTTP response object
 * @return {Promise<Response>}
 */
const addProduct = async (req, res) => {
  if (!req.body.product) {
      return res.status(400).json({error: LockerCollectionControllerErrors.MissingProduct})
  }
  try {
      // See if product exists for the given locker
      const lockerProduct = await LockerProduct.findOne({locker: req.locker._id, product: req.body.product});
      if (!lockerProduct) {
        const newLockerProduct = await (new LockerProduct({user: req.auth._id, locker: req.locker._id, product: req.body.product, locker_collections: [req.lockerCollection._id]})).save()
        return res.status(200).json({_id: newLockerProduct._id});
      } else {
        await lockerProduct.updateOne({$addToSet: {locker_collections: req.lockerCollection._id}});
        return res.status(200).json({_id: lockerProduct._id});
      }
  } catch (err) {
      return res.status(400).json({ error: ErrorHandler.getErrorMessage(err) || err.message });
  }
};


/**
 * @desc Remove a locker product from a locker collection.
 * @param {Request} req HTTP request object
 * @param {Response} res HTTP response object
 * @return {Promise<Response>}
 */
const removeProduct = async (req, res) => {
  try {
    await req.locker_product.updateOne({$pull: {locker_collections: req.lockerCollection._id}});
    return res.status(200).json({_id: req.locker_product._id});
  } catch (err) {
      return res.status(400).json({ error: ErrorHandler.getErrorMessage(err) || err.message });
  }
};


/**
 * @desc Clone someone's collection. Take all of their copies and make a deep copy of the collection and their products.
 * @param {Request} req HTTP request object
 * @param {Response} res HTTP response object
 * @return {Promise<Response>}
 */
const clone = async (req, res) => {
  try {

    // get requesters' locker
    const requesterLocker = await Locker.findOne({ user: req.auth._id });
    if (!requesterLocker) {
      return res.status(500).json({ error: `Server Error: Unable to find a locker for user ${req.auth._id}` });
    }

    // create a deep copy of the original collection
    const lockerCollectionData = {
      user: req.auth._id,
      name: req.lockerCollection.name,
      description: req.lockerCollection.description,
    };

    // create a deep copy of the hero image
    if (req.lockerCollection.hero) {
      const originalMedia = await Media.findById(req.lockerCollection.hero._id);
      const heroBuffer = (await S3Services.getMediaS3(originalMedia.key)).Body;
      const newHeroMedia = await S3Services.createMedia(heroBuffer, originalMedia.mimetype, originalMedia.originalName,
        originalMedia.type, req.auth._id, originalMedia.uploadedByType);
      lockerCollectionData.hero = newHeroMedia._id;
    }

    // create a new locker collection with new data
    const newLockerCollection = await (new LockerCollection(lockerCollectionData)).save();

    // Create a deep copy of all products if requester not owner of locker, else just reference products correctly.
    const allLockerCollectionProducts = await LockerProduct.find({locker: req.locker._id, locker_collections: {$in: [req.lockerCollection._id]}});
    const newLockerProducts = []
      for (let lockerCollectionProduct of allLockerCollectionProducts) {
        if (req.auth._id != req.locker.user) {
          newLockerProducts.push(
            await (new LockerProduct({
              user: req.auth._id,
              product: lockerCollectionProduct.product,
              locker: requesterLocker._id,
              locker_collections: [newLockerCollection._id],
            })).save()
          );
        } else {
          await lockerCollectionProduct.updateOne({$addToSet: {locker_collections: newLockerCollection._id}});
          newLockerProducts.push(lockerCollectionProduct._id);
        }
    }

    // add cloned locker to requester locker
    await requesterLocker.updateOne({$addToSet: {locker_collections: newLockerCollection._id}});
    return res.status(200).json({ _id: newLockerCollection._id, locker_products: newLockerProducts});
  
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: ErrorHandler.getErrorMessage(err) || err.message });
  }
};

/**
 * @desc Reference a someone's collection
 * @param {Request} req HTTP request object
 * @param {Response} res HTTP response object
 * @return {Promise<Response>}
 */
const reference = async (req, res) => {
  try {

    // get requesters' locker
    const requesterLocker = await Locker.findOne({ user: req.auth._id });
    if (!requesterLocker) {
      return res.status(500).json({ error: `Server Error: Unable to find a locker for user ${req.auth._id}` });
    }
    // add referenced locker to requester locker
    await requesterLocker.updateOne({$addToSet: {locker_collections: req.lockerCollection._id}});    
    return res.status(200).json({ _id: req.lockerCollection._id});
  } catch (err) {
    return res.status(500).json({ error: ErrorHandler.getErrorMessage(err) || err.message });
  }
};

export default {
  lockerCollectionById,
  list,
  create,
  read,
  update,
  remove,
  getProducts,
  addProduct,
  removeProduct,
  clone,
  reference,
};
