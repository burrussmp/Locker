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
import ProductCtrl from '@server/controllers/product.controller';
import LockerServices from '@server/services/database/locker/locker.services';
import S3Services from '@server/services/s3';

import ErrorHandler from '@server/services/error.handler';
import StaticStrings from '@config/StaticStrings';
import { S3 } from 'aws-sdk';

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
      .populate('products')
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
      product_list: req.body.product_list,
      description: req.body.description,
    };
    try {
      const newLockerCollection = await (new LockerCollection(lockerCollectionData)).save();
      
      // add new collection
      await req.locker.updateOne({$addToSet: {collections: newLockerCollection._id}});
      
      // add any products in collection that aren't in locker
      const lockerProductIDs = req.locker.products.map(x=>x._id);
      for (let lockerProduct of newLockerCollection.products) {
        if (!lockerProductIDs.includes(lockerProduct)){
            await Locker.addLockerProduct(lockerProduct);
        }
      }


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
      const updatedLockerCollection = await LockerCollection.findOneAndUpdate({_id: req.lockerCollection._id}, req.body, { new: true, runValidators: true });
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
      const errMessage = ErrorHandler.getErrorMessage(err);
      return res.status(400).json({ error: errMessage || err.message });
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
    await req.locker.updateOne({$pull: {collections: req.lockerCollection._id}});
    const deletedDocument = await req.lockerCollection.deleteOne();
    return res.json(deletedDocument);
  } catch (err) {
    return res.status(500).json({ error: ErrorHandler.getErrorMessage(err) });
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
      const productIds = req.lockerCollection.products.map( x => x.product);
      const products = await Product.find().where('_id').in(productIds).exec();
      const productsFiltered = products.map(x=>LockerServices.filterLockerProduct(x));
      return res.status(200).json(productsFiltered);
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
      // add new product to collection
      const newLockerProduct = await (new LockerProduct({product: req.body.product})).save()
      await req.lockerCollection.addLockerProduct(newLockerProduct._id)
      
      // add to locker if not already there
      const alreadyExistsInLocker = req.locker.products.filter(x=>x.product.toString() == req.body.product).length != 0;
      if (!alreadyExistsInLocker) {
        await req.locker.addLockerProduct(newLockerProduct._id);
      }
      // return results
      return res.status(200).json({message: LockerCollectionControllerErrors.AddedProductToLocker})
  } catch (err) {
      return res.status(400).json({ error: ErrorHandler.getErrorMessage(err) || err.message });
  }
};


/**
 * @desc Remove a product from a locker collection. If that product is in no other collection, remove from locker too.
 * @param {Request} req HTTP request object
 * @param {Response} res HTTP response object
 * @return {Promise<Response>}
 */
const removeProduct = async (req, res) => {
  if (!req.body.product) {
      return res.status(400).json({error: LockerCollectionControllerErrors.MissingProduct})
  }
  const matchingProducts = req.lockerCollection.products.filter(x=>x.product.toString() == req.body.product);
  if (matchingProducts.length == 0){
      return res.status(400).json({error: LockerCollectionControllerErrors.NotFoundError});
  }
  try {
      // remove from collection
      await req.lockerCollection.removeLockerProduct(matchingProducts[0]._id);

      // check if any other collection contains product
      const allCollections = await Locker.findById(req.locker._id).populate('collections', 'products').exec()
      const productNotInCollection = allCollections.every(collection => !collection.products.includes(matchingProducts[0]._id))
      if (productNotInCollection) {
        await req.locker.removeLockerProduct(matchingProducts[0]._id);
      }

      return res.status(200).json({message: "Successfully removed product from locker."})
  } catch (err) {
      return res.status(400).json({ error: ErrorHandler.getErrorMessage(err) });
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
    const requesterLocker = await Locker.findOne({ user: req.auth._id }).populate;
    if (!requesterLocker) {
      return res.status(500).json({ error: `${ServerError}: ${req.auth._id}` });
    }

    // create a deep copy of the original collection
    const lockerCollectionData = JSON.parse(JSON.stringify(req.lockerCollection));
    lockerCollectionData.user = req.auth._id;
    
    // make a deep copy of the products by creating new products
    let newLockerProducts = [];
    for (let lockerProduct of lockerCollectionData.products) {
      newLockerProducts.push(await (new LockerProduct(lockerProduct.product)).save());
    }
    lockerCollectionData.products = newLockerProducts;

    // make a deep copy of the media by creating a new hero image
    if (req.lockerCollection.hero) {
      const originalMedia = await Media.findById(req.lockerCollection.hero._id);
      const heroBuffer = (await S3Services.getMediaS3(lockerCollectionData.hero.key)).Body;
      const newHeroMedia = await S3Services.createMedia(heroBuffer, originalMedia.mimetype, originalMedia.originalName,
        originalMedia.type, req.auth._id, originalMedia.uploadedByType);
      lockerCollectionData.hero = newHeroMedia._id;
    }

    // create a new locker collection with new data
    const newLockerCollection = await (new LockerCollection(lockerCollectionData)).save();
      
    // add the new collection to the locker
    await requesterLocker.updateOne({$addToSet: {collections: newLockerCollection._id}});
    
    // add any products in collection that aren't in locker
    const lockerProductIDs = requesterLocker.products.map(x=>x._id);
    for (let lockerProduct of newLockerCollection.products) {
      if (!lockerProductIDs.includes(lockerProduct)){
          await Locker.addLockerProduct(lockerProduct);
      }
    }  

    return res.status(200).json({ _id: newLockerCollection._id});
  } catch (err) {
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
    const requesterLocker = await Locker.findOne({ user: req.auth._id }).populate;
    if (!requesterLocker) {
      return res.status(500).json({ error: `${ServerError}: ${req.auth._id}` });
    }
      
    // Reference the new locker in your own
    await requesterLocker.updateOne({$addToSet: {collections: req.lockerCollection._id}});

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
