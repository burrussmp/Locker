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
    ServerErrorTokenNotDecrypted: "ServerError: Token unable to be decrypted properly or missing appropriate fields",
    InvalidTokenNotCollection: "ServerError: Incorrect collection attached to token, not valid",
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
        RetrieveServerError : 'ServerError: Unable to retrieve file',
        BadImageUploadSuccessfulDelete: 'ServerError: Unable to upload image but clean up S3 worked.',
        BadRequestMissingFile: 'Missing file to upload'
    },
    UserControllerErrors : {
        BadRequestInvalidFields: "(Bad request) The following are invalid fields",
        BadUploadSuccessfulDelete: "ServerError: Unable to update profile picture but clean up S3 worked.",
        ProfilePhotoNotFound: "Profile photo not found"
    },
    ImageModelErrors : {
        KeyRequired: "S3 file key is required",
        TypeRequired: "The type is required (e.g profile_photo)",
        MimeTypeRequired: "The mimetype is required (e.g image/png)",
        OriginalNameRequired: "The original name of the upload is required",
        DescriptionTooLong: "Description cannot exceed 180 characters",
        UploadedByRequired: "The ObjectID of the uploader is required",
        UnacceptableType: "ServerError: Image must be an acceptable type (e.g. profile_photo)",
        KeyAlreadyExists: "ServerError: The S3 key must be unique (and should be)"
    },
    UserModelErrors : {
        InvalidGender: "Valid gender is required",
        InvalidPhoneNumber: "Valid phone number is required",
        InvalidEmail: "Valid email is required",
        UsernameAlreadyExists: "Username already exists",
        PhoneNumberAlreadyExists: "Phone number already exists",
        EmailAlreadyExists: "Email already exists",
        PhoneNumberRequired: "Phone number is required",
        PasswordRequired: "Password is required",
        UsernameRequired: "Username is required",
        LastNameRequired: "Last name is required",
        FirstNameRequired :"First name is required",
        EmailRequired: "Email is required",
        UsernameExceedLength: "Username exceeds max length (32)",
        InvalidUsername: "Valid alphanumeric username (underscores allowed) is required",
        PasswordTooShort: "Password length must be > 7",
        PasswordNoNumbers: "Password must contain at least one numeric character",
        PasswordNoSpecial: "Password must contain at least one of: @, !, #, $, % or ^",
        PasswordNoLowercase: "Password must contain at least one lowercase character",
        PasswordNoUppercase: "Password must contain at least one uppercase character"
    },
    SignedUpSuccess: "Successfully signed up!",
    LoggedOutSuccess: "Logged out",
    UploadProfilePhotoSuccess: "Successfully uploaded user profile photo",
    RemoveProfilePhotoSuccess: "Successfully removed profile photo",
};

export default StaticStrings;