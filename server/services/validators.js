"use strict";

const isValidEmail = (str) => {
    return str.match(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/i);
};

const isValidPhoneNumber = (str) => {
    return str.match(/^[2-9]\d{2}-\d{3}-\d{4}$/i);
}

const isValidUsername = (str) => {
    return str.match(/^\w+$/i)
}

const isValidPassword = (password,isNew) => {
    if (!password && isNew){
      return 'Password is required';
    } else if (!password && !isNew){
      return undefined; // no update and not new
    } else if (password.length < 8) {
      return "Password length must be > 7";
    } else if (!password.match(/[0-9]/i)) {
      return `Password must contain at least one numeric character`;
    } else if (!password.match(/[a-z]/)) {
      return `Password must contain at least one lowercase character`;
    } else if (!password.match(/\@|\!|\#|\$|\%|\^/i)) {
      return `Password must contain at least one of: @, !, #, $, % or ^`;
    } else if (!password.match(/[A-Z]/)) {
      return `Password must contain at least one uppercase character`
    }
    return undefined;
  };

export {
    isValidEmail,
    isValidPhoneNumber,
    isValidUsername,
    isValidPassword
}