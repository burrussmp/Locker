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

export default {
  queryBuilder,
};
