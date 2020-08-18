"use strict";

const StaticStrings = {
    ErrorUnauthorizedMissingToken: 'UnauthorizedError: Invalid or missing JWT token.',
    ErrorUserNotFound: 'User not found',
    ErrorInsufficientPermissions: 'Insufficient permissions',
    ErrorPasswordUpdateIncorrect: 'Old password is incorrect',
    ErrorPasswordUpdateMissing: 'Must include the old password',
    ErrorCannotUpdateHashedPassword: 'Updating hashed password not allowed',
    ErrorEmptyUpdate : 'Update object empty',
    ErrorsLogin : {
        MissingLogin: "Missing username, phone number, or email",
        MissingPassword: "Missing password",
        UserNotFound: "User not found",
        InvalidPassword: "Invalid password",
        ServerError: "Sorry, we could not log you in"
    },
    SuccessSignedUp: "Successfully signed up!",
    SuccessLoggedOut: "Logged out"
};

export default StaticStrings;