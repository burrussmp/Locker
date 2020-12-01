/* eslint-disable max-len */
'use strict';

/**
 * @desc Parses comma-delimited tags
 * @param {String} data Serialized data to parse
 * @param {String} name The name of the field (useful in error message)
 * @return {Object | undefined} The JSON data or undefined if error occurred
 */
const deserializeAttr = (data, name='Name not provided') => {
  if (data) {
    try {
      return JSON.parse(data);
    } catch (err) {
      console.log(`Error: Unable to deserialize attribute '${name}'.\nData: ${data}.\nReason: ${err}`);
    }
  }
};

/**
 * @desc Create a query for a Mongoose find operation on a Product model
 * @param {Request} req HTTP Request
 * @return {Object} A query to control what is returned from the product list
 */
const queryBuilder = (req) => {
  const query = {};
  if (req.query.organization) {
    query.organization = req.query.organization;
  }
  if (req.query.available) {
    const availableLowercase = req.query.available.toLowerCase();
    query.available = availableLowercase == 'true';
  }
  return query;
};

export default {
  deserializeAttr,
  queryBuilder,
};
