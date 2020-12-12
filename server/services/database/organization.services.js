/* eslint-disable max-len */
'use strict';

/**
 * @desc Create a query for a Mongoose find on Organizations
 * @param {Request} req HTTP request
 * @return {Object} A query to control what is returned from the Post find
 */
const queryBuilder = (req) => {
  const query = {};
  if (req.query.name) {
    query.name = req.query.name;
  }
  if (req.query.url) {
    query.url = req.query.url;
  }
  return query;
};

export default {
  queryBuilder,
};
