"use strict";

const StaticStrings = {
    UnauthorizedMissingTokenError: 'UnauthorizedError: Invalid or missing JWT token.',
    UserNotFoundError: 'User not found',
    NotOwnerError: "User is not authorized to access resource",
    InsufficientPermissionsError: 'Insufficient permissions',
    PasswordUpdateIncorrectError: 'Old password is incorrect',
    PasswordUpdateMissingError: 'Must include the old password',
    CannotUpdateHashedPasswordError: 'Updating hashed password not allowed',
    EmptyUpdateError : 'Update object empty',
    LoginErrors : {
        MissingLogin: "Missing username, phone number, or email",
        MissingPassword: "Missing password",
        UserNotFound: "User not found",
        InvalidPassword: "Invalid password",
        ServerError: "Sorry, we could not log you in"
    },
    S3ServiceErrors : {
        InvalidImageMimeType: "Invalid Mime Type, only JPEG and PNG",
        BadRequestWrongKey: "Bad request: Form-day incorrect. Should be 'image'",
        UploadServerError: 'ServerError: Unable to upload file',
        DeleteServerError: 'ServerError: Unable to delete file',
        BadImageUploadSuccessfulDelete: 'ServerError: Unable to upload image but clean up S3 worked.',
        BadRequestMissingFile: 'Missing file to upload'
    },
    UserControllerErrors : {
        BadRequestInvalidFields: "(Bad request) The following are invalid fields",
        BadUploadSuccessfulDelete: "ServerError: Unable to update profile picture but clean up S3 worked.",
        ProfilePhotoNotFound: "Profile photo not found"
    },
    SignedUpSuccess: "Successfully signed up!",
    LoggedOutSuccess: "Logged out",
    UploadProfilePhotoSuccess: "Successfully uploaded user profile photo.",
    RemoveProfilePhotoSuccess: "Successfully removed profile photo.",
};

export default StaticStrings;