/* eslint-disable no-shadow */
/* eslint-disable no-underscore-dangle */
/* eslint-disable max-len */

// imports

import Locker from '@server/models/locker/locker.model';
import LockerProduct from '@server/models/locker/lockerproduct.model';
import Product from '@server/models/product.model';

import Validator from '@server/services/validator';
import LockerServices from '@server/services/database/locker/locker.services';

import ErrorHandler from '@server/services/error.handler';
import StaticStrings from '@config/StaticStrings';

const { LockerControllerErrors } = StaticStrings;

/**
 * @desc Filter a locker and return public information
 * @param {object} locker The Mongoose information of a locker model
 * @return {object} A filtered organization
 */
const filterLocker = (locker) => {
    const filteredLocker = JSON.parse(JSON.stringify(locker));
    filteredLocker.__v = undefined;
    return filteredLocker;
};

/**
 * @desc Middleware to parse url parameter :lockerId
 * @param {Request} req HTTP request object
 * @param {Response} res HTTP response object
 * @param {Function} next Next express middleware function
 * @param {Number} id The ID of the collection
 * @return {Promise<Response>}
 */
const lockerById = async (req, res, next, id) => {
    try {
        const locker = await Locker.findById(id).populate('products').exec();
        if (!locker) {
            return res.status(404).json({ error: LockerControllerErrors.NotFoundError });
        }
        req.locker = locker;
        req.owner = locker.user;
        return next();
    } catch (err) {
        return res.status(404).json({ error: LockerControllerErrors.NotFoundError });
    }
};

/**
 * @desc Creates a new locker.
 * @param {Request} req HTTP request object
 * @param {Response} res HTTP response object
 * @return {Promise<Response>}
 */
const create = async (req, res) => {
    const lockerData = {user: req.auth._id};
    try {
        const locker = await (new Locker(lockerData)).save();
        return res.status(200).json({ _id: locker._id });
    } catch (err) {
        return res.status(400).json({ error: ErrorHandler.getErrorMessage(err) || err.message });
    }
};

/**
 * @desc Retrieve a locker.
 * @param {Request} req HTTP request object
 * @param {Response} res HTTP response object
 * @return {Promise<Response>}
 */
const read = (req, res) => {
    try {
        return res.status(200).json(filterLocker(req.locker));
    } catch (err) {
        return res.status(500).json({ error: ErrorHandler.getErrorMessage(err) || err.message });
    }
};

/**
 * @desc List off lockers with a query builder
 * @param {Request} req HTTP request object
 * @param {Response} res HTTP response object
 * @return {Promise<Response>}
 */
const list = async (req, res) => {
    const query = LockerServices.queryBuilder(req);
    try {
        const lockers = await Locker.find(query, null).select('_id createdAt');
        return res.json(lockers);
    } catch (err) {
        return res.status(400).json({
            error: ErrorHandler.getErrorMessage(err) || err.message,
        });
    }
};

/**
 * @desc Update a locker
 * @param {Request} req HTTP request object
 * @param {Response} res HTTP response object
 * @return {Promise<Response>}
 */
const update = async (req, res) => Validator.validateUpdateFields(req, res, ['name'], async (req, res) => {
    try {
        const locker = await Locker.findOneAndUpdate({ _id: req.params.lockerId }, req.body, { new: true, runValidators: true });
        if (!locker) return res.status(500).json({ error: StaticStrings.UnknownServerError });
        return res.status(200).json(filterLocker(locker));
    } catch (err) {
        const errMessage = ErrorHandler.getErrorMessage(err);
        return res.status(400).json({ error: errMessage || err.message });
    }
});

/**
 * @desc Delete a locker
 * @param {Request} req HTTP request object
 * @param {Response} res HTTP response object
 * @return {Promise<Response>}
 */
const remove = async (req, res) => {
    try {
        return res.json(await req.locker.deleteOne());
    } catch (err) {
        return res.status(500).json({ error: ErrorHandler.getErrorMessage(err) || err.message });
    }
};

/**
 * @desc Retrieve all locker products associated with a locker and query based on the HTTP query params
 * @param {Object} req HTTP request object
\ */
const getQueriedLockerProductList = async (req) => {
    let filteredLockerProducts = await LockerProduct.find({locker: req.locker._id});
    if (req.query.added_after) {
        filteredLockerProducts = filteredLockerProducts.filter( lockerProduct => {
            const addedDate = new Date(lockerProduct.timestamp_locked).getTime() / 1000;
            return addedDate > req.query.added_after
        });
    }
    if (req.query.orphan) {
        filteredLockerProducts = filteredLockerProducts.filter( lockerProduct => !lockerProduct.locker_collections || lockerProduct.locker_collections.length == 0);  
    }
    return filteredLockerProducts;
}

/**
 * @desc Get all products in a locker
 * @param {Request} req HTTP request object
 * @param {Response} res HTTP response object
 * @return {Promise<Response>}
 */
const getProducts = async (req, res) => {
    try {
        const queryFilteredProducts = await getQueriedLockerProductList(req);
        return res.status(200).json(queryFilteredProducts.map(x=>LockerServices.filterLockerProduct(x)));
    } catch (err) {
        return res.status(500).json({ error: ErrorHandler.getErrorMessage(err) || err.message });
    }
};

/**
 * @desc Add a product to a locker
 * @param {Request} req HTTP request object
 * @param {Response} res HTTP response object
 * @return {Promise<Response>}
 */
const addProduct = async (req, res) => {
    if (!req.body.product) {
        return res.status(400).json({error: LockerControllerErrors.MissingProduct})
    }
    try {
        const lockerProduct = await LockerProduct.findOne({locker: req.locker._id, product: req.body.product});
        if (lockerProduct) {
            return res.status(400).json({error: LockerControllerErrors.ProductAlreadyInLocker});
        }
        const newLockerProduct = await (new LockerProduct({locker: req.locker._id, product: req.body.product})).save()
        return res.status(200).json({_id: newLockerProduct._id})
    } catch (err) {
        return res.status(400).json({ error: ErrorHandler.getErrorMessage(err) || err.message });
    }
};

/**
 * @desc Remove a product from a locker
 * @param {Request} req HTTP request object
 * @param {Response} res HTTP response object
 * @return {Promise<Response>}
 */
const removeProduct = async (req, res) => {
    if (!req.body.locker_product) {
        return res.status(400).json({error: LockerControllerErrors.MissingLockerProduct})
    }
    try {
        const lockerProduct = await LockerProduct.findById(req.body.locker_product);
        if (!lockerProduct) {
            return res.status(400).json({error: `${StaticStrings.LockerProductControllerErrors.NotFoundError}: ${req.body.locker_product}`});
        }
        if (lockerProduct.locker.toString() != req.locker._id.toString()) {
            return res.status(401).json({error: LockerControllerErrors.LockerProductNotPartOfYourLocker})
        }
        return res.status(200).json(await lockerProduct.deleteOne())
    } catch (err) {
        return res.status(400).json({ error: ErrorHandler.getErrorMessage(err) || err.message });
    }
};

export default {
    list,
    create,
    read,
    update,
    remove,
    getProducts,
    lockerById,
    addProduct,
    removeProduct,
};
