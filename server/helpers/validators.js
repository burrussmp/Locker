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

export {
    isValidEmail,
    isValidPhoneNumber,
    isValidUsername
}