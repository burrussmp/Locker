/* eslint-disable max-len */
'use strict';

/**
 * @desc Create a query for a Mongoose find operation for a Locker model
 * @param {Request} req HTTP Request
 * @return {Object} A query to control find on Locker model
 */
const queryBuilder = (req) => {
  const query = {};
  if (req.query.user) {
    query.user = req.query.user;
  }
  return query;
};

/**
 * Filter a product document for the locker.
 * @param {Product} product A Product document 
 * @return {Object} A filtered product object.
 */
const filterLockerProduct = (product) => {
  const filteredLockerProduct = JSON.parse(JSON.stringify(product));
  filteredLockerProduct.__v = undefined;
  filteredLockerProduct.last_scraped = undefined;
  filteredLockerProduct.approved = undefined;
  filteredLockerProduct.visible = undefined;
  filteredLockerProduct.tags = undefined;
  filteredLockerProduct.meta = undefined;
  return filteredLockerProduct
}

export default {
  queryBuilder,
  filterLockerProduct,
};
