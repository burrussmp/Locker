"use strict";

const StaticStrings = {
    // errors
    ErrorUnauthorizedMissingToken: 'UnauthorizedError: Invalid or missing JWT token.',
    ErrorUserNotFound: 'User not found',
    ErrorInsufficientPermissions: 'Insufficient permissions',
    ErrorPasswordUpdateIncorrect: 'Old password is incorrect',
    ErrorPasswordUpdateMissing: 'Must include the old password',
    ErrorCannotUpdateHashedPassword: 'Updating hashed password not allowed',
    // success
    SuccessSignedUp: "Successfully signed up!",
    
};

export default StaticStrings;