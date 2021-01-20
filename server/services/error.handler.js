/* eslint-disable max-len */
'use strict';

/**
 * @desc Helper function to return the error message from an error Object
 * @param {Error} err A thrown error
 * @return {String} The error message from the thrown Error
 */
const getUniqueErrorMessage = (err) => {
  let output;
  try {
    const fieldName = err.message.substring(err.message.lastIndexOf('.$') + 2, err.message.lastIndexOf('_1'));
    output = fieldName.charAt(0).toUpperCase() + fieldName.slice(1) + ' already exists';
  } catch (ex) {
    output = 'Unique field already exists';
  }

  return output;
};

/**
 * @desc Parse an error code and appropriately return a message
 * @param {Error} err A thrown error
 * @return {String} The error message from the thrown Error
 */
const getErrorMessage = (err) => {
  let message = '';
  if (err.code) {
    switch (err.code) {
      case 11000:
      case 11001:
        message = getUniqueErrorMessage(err);
        break;
      default:
        message = err.message;
    }
  } else if (typeof err == 'string' || err instanceof String) {
    return err;
  } else {
    for (const errName in err.errors) {
      if (err.errors[errName].message) {
        message = err.errors[errName].message;
      }
    }
  }
  return message;
};

export default {getErrorMessage};
