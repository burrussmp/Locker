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
        const locker = await Locker.findById(id)
            .populate('products')
            .exec();
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
    const lockerData = {
        user: req.auth._id,
    };
    try {
        const locker = new Locker(lockerData);
        await locker.save();
        return res.status(200).json({ _id: locker._id });
    } catch (err) {
        return res.status(400).json({ error: ErrorHandler.getErrorMessage(err) });
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
        return res.status(500).json({
            error: ErrorHandler.getErrorMessage(err),
        });
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
        const deletedDocument = await req.locker.deleteOne();
        return res.json(deletedDocument);
    } catch (err) {
        return res.status(500).json({ error: ErrorHandler.getErrorMessage(err) });
    }
};

/**
 * @desc Filter allProducts based on req query parameters
 * @param {Request} req HTTP request object
 * @param {Array} allProducts 
 */
const filterProductList = (req, allProducts) => {
    let filteredProducts = JSON.parse(JSON.stringify(allProducts));
    if (req.query.added_after) {
        filteredProducts = filteredProducts.filter( product => {
            const addedDate = new Date(product.timestamp_added).getTime() / 1000;
            return addedDate > req.query.added_after
        });
    }
    return filteredProducts;
}

/**
 * @desc Get all products in a locker
 * @param {Request} req HTTP request object
 * @param {Response} res HTTP response object
 * @return {Promise<Response>}
 */
const getProducts = async (req, res) => {
    try {
        const productList = filterProductList(req, req.locker.products);
        const productIds = productList.map( x => x.product);
        const products = await Product.find().where('_id').in(productIds).exec();
        const productsFiltered = products.map(x=>LockerServices.filterLockerProduct(x));
        return res.status(200).json(productsFiltered);
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
    let alreadyExists = req.locker.products.filter(x=>x.product.toString() == req.body.product).length != 0;
    if (alreadyExists) {
        return res.status(400).json({error: LockerControllerErrors.ProductAlreadyInLocker});
    }
    try {
        const newLockerProduct = await (new LockerProduct({product: req.body.product})).save()
        await req.locker.addLockerProduct(newLockerProduct._id)
        return res.status(200).json({message: LockerControllerErrors.AddedProductToLocker})
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
    if (!req.body.product) {
        return res.status(400).json({error: StaticStrings.LockerControllerErrors.MissingProduct})
    }
    let matchingProducts = req.locker.products.filter(x=>x.product.toString() == req.body.product);
    if (matchingProducts.length == 0){
        return res.status(400).json({error: StaticStrings.ProductControllerErrors.NotFoundError});
    }
    try {
        
        await req.locker.removeLockerProduct(matchingProducts[0]._id)
        return res.status(200).json({message: "Successfully removed product from locker."})
    } catch (err) {
        return res.status(400).json({ error: ErrorHandler.getErrorMessage(err) });
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
