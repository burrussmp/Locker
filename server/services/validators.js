/* eslint-disable no-useless-escape */
/* eslint-disable max-len */
'use strict';
import mongoose from 'mongoose';
import StaticStrings from '@config/StaticStrings';


/**
 * @desc Check if valid email
 * @param {String} str - A email
 * @return {Boolean} true if valid else false
 */
const isValidEmail = (str) => {
  return str.match(
      /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/i,
  );
};

/**
 * @desc Check if valid phone number
 * @param {String} str A phone number
 * @return {Boolean} true if valid else false
 */
const isValidPhoneNumber = (str) => {
  return str.match(/^[2-9]\d{2}-\d{3}-\d{4}$/i);
};


/**
 * @desc Checks if username is valid
 * @param {String} str - A username
 * @return {String} An error message if it exists
 */
const isValidUsername = (str) => {
  if (!str || !str.trim()) {
    return StaticStrings.UserModelErrors.UsernameRequired;
  } else if (!str.match(/^\w+$/i)) {
    return StaticStrings.UserModelErrors.InvalidUsername;
  } else if (str.length > 32) {
    return StaticStrings.UserModelErrors.UsernameExceedLength;
  } else {
    return undefined;
  }
};


/**
 * @desc Check if valid phone number
 * @param {String} password A potential password
 * @param {Boolean} isNew Whether or not this is a new model or an update
 * @return {String} An error message if password is invalid
 */
const isValidPassword = (password) => {
  if (!password || !password.trim()) {
    return StaticStrings.UserModelErrors.PasswordRequired;
  } else if (password.length < 8) {
    return StaticStrings.UserModelErrors.PasswordTooShort;
  } else if (!password.match(/[0-9]/i)) {
    return StaticStrings.UserModelErrors.PasswordNoNumbers;
  } else if (!password.match(/[a-z]/)) {
    return StaticStrings.UserModelErrors.PasswordNoLowercase;
  } else if (
    !password.match(
        /\^|\$|\*|\.|\[|\]|\{|\}|\(|\)|\?|\"|\!|\@|\#|\%|\&|\/|\\|\,|\>|\<|\'|\:|\;|\||\_|\~|\`/i,
    )
  ) {
    return StaticStrings.UserModelErrors.PasswordNoSpecial;
  } else if (!password.match(/[A-Z]/)) {
    return StaticStrings.UserModelErrors.PasswordNoUppercase;
  }
  return undefined;
};

/**
 * @desc Helper to create a Mongoose validation error
 * @param {String} message The message for the validation
 * @return {Error} A mongoose validation error
 */
const createValidationError = (message) => {
  const validatorError = new mongoose.Error.ValidatorError({message: message});
  return validatorError;
};

export default {
  isValidEmail,
  isValidPhoneNumber,
  isValidUsername,
  isValidPassword,
  createValidationError,
};
