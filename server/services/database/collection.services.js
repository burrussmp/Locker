/* eslint-disable max-len */
'use strict';

/**
 * @desc Create a query for a Mongoose find operation on a Collection model
 * @param {Request} req HTTP Request
 * @return {Object} A query to control what is returned from the product list
 */
const queryBuilder = (req) => {
  const query = {};
  if (req.query.name) {
    query.name = req.query.name;
  }
  if (req.query.organization) {
    query.organization = req.query.organization;
  }
  return query;
};

export default {
  queryBuilder,
};
