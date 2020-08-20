"use strict";
import StaticStrings from '../../config/StaticStrings';

/**
  * @desc Check if valid email
  * @param String str - A email
  * @return true if valid else false
*/ 
const isValidEmail = (str) => {
    return str.match(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/i);
};

/**
  * @desc Check if valid phone number
  * @param String str - A phone number
  * @return true if valid else false
*/ 
const isValidPhoneNumber = (str) => {
    return str.match(/^[2-9]\d{2}-\d{3}-\d{4}$/i);
}

/**
  * @desc Check if valid username
  * @param String str - A username
  * @return true if valid else false
*/ 
const isValidUsername = (str) => {
    return str.match(/^\w+$/i)
}

/**
  * @desc Check if valid password
  * @param String password  - A potential password
  * @param Bool   isNew     - Whether or not this is a new model or an update
  * @return error message if error else undefined
*/ 
const isValidPassword = (password,isNew) => {
    if (!password && isNew){
      return StaticStrings.UserModelErrors.PasswordRequired;
    } else if (!password && !isNew){
      return undefined; // no update and not new
    } else if (password.length < 8) {
      return StaticStrings.UserModelErrors.PasswordTooShort;
    } else if (!password.match(/[0-9]/i)) {
      return StaticStrings.UserModelErrors.PasswordNoNumbers;
    } else if (!password.match(/[a-z]/)) {
      return StaticStrings.UserModelErrors.PasswordNoLowercase;
    } else if (!password.match(/\@|\!|\#|\$|\%|\^/i)) {
      return StaticStrings.UserModelErrors.PasswordNoSpecial;
    } else if (!password.match(/[A-Z]/)) {
      return StaticStrings.UserModelErrors.PasswordNoUppercase
    }
    return undefined;
  };

export {
    isValidEmail,
    isValidPhoneNumber,
    isValidUsername,
    isValidPassword
}