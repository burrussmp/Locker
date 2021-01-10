/* eslint-disable max-len */
'use strict';

/**
 * @desc Create a query for a Mongoose find operation on a post model
 * @param {Request} req HTTP request
 * @return {Object} A query to control what is returned from the Post find
 */
const queryBuilder = (req) => {
  const query = {};
  if (req.query.type) {
    query.contentType = req.query.type;
  }
  if (req.query.productID) {
    query.name = req.query.productID;
  }
  return query;
};

export default {
  queryBuilder,
};
