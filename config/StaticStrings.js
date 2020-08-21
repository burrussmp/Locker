"use strict";
const StaticStrings = {
    UnauthorizedMissingTokenError: 'UnauthorizedError: Invalid or missing JWT token.',
    UserNotFoundError: 'User not found',
    NotOwnerError: "User is not authorized to access resource",
    InsufficientPermissionsError: 'Insufficient permissions',
    CannotUpdateHashedPasswordError: 'Updating hashed password not allowed',
    EmptyUpdateError : 'Update object empty',
    ServerErrorTokenNotDecrypted: "ServerError: Token unable to be decrypted properly or missing appropriate fields",
    InvalidTokenNotCollection: "ServerError: Incorrect collection attached to token, not valid",
    BadRequestFieldsNeeded: "The following fields are needed",
    BadRequestInvalidFields: "(Bad request) The following are invalid fields",
    TokenIsNotValid: "This token is not valid (possible user no longer exists)",
    UnknownServerError: "ServerError: Unknown",
    NotImplementedError: "Not Implemented",
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
        RetrieveServerError : 'ServerError: Unable to send file, but it exists in S3',
        BadImageUploadSuccessfulDelete: 'ServerError: Unable to upload image but clean up S3 worked.',
        BadRequestMissingFile: 'Missing file to upload'
    },
    UserControllerErrors : {
        BadUploadSuccessfulDelete: "ServerError: Unable to update profile picture but clean up S3 worked.",
        ProfilePhotoNotFound: "Profile photo not found",
        FollowSelfError: "Cannot follow yourself",
        UnfollowSelfError: "Cannot unfollow yourself",
        FollowingMissingID: "Missing either ID of follower or following. This is actually a server error."
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
        PasswordNoUppercase: "Password must contain at least one uppercase character",
        PasswordUpdateIncorrectError: 'Old password is incorrect',
        PasswordUpdateSame : "Cannot update with the same old password",
    },
    CommentModelErrors: {
        MaxCommentSizeError: "Comment must be less than 120 characters",
        CommentNotFoundError: "Comment not found",
        ReplyTextRequired: "The reply text cannot be empty"
    },
    PostModelErrors: {
        MaxDescriptionSizeError: "Descriptions must be less than 180 characters",
        BadReactionType: "Unsupported reaction",
        MissingPoster: "A specific user must post",
        MaxLengthTag: "A tag cannot exceed 20 characters",
        TagMustBeAlphabetical: "The tag can only contain uppercase and lowercase letters",
        IncorrectType: "This type of post is not supported",
        MissingContent: "This post is missing content",
        PostNotFoundError: "Post not found",
        PriceNotNonnegative : "A price must be non-negative",
        ContentPostErrors: {
            PriceRequired: "Must specify the price of a content post"
        },
        CreateMissingType: "Missing 'type' in request body"

    },
    MediaControllerErrors: {
        MediaNotFound: "Error requested media not found"
    },
    SignedUpSuccess: "Successfully signed up!",
    LoggedOutSuccess: "Logged out",
    UploadProfilePhotoSuccess: "Successfully uploaded user profile photo",
    RemoveProfilePhotoSuccess: "Successfully removed profile photo",
    UpdatedPasswordSuccess: "Successfully updated password",
    AddedFollowerSuccess : "Following someone new!",
    RemovedFollowerSuccess : "Successfully unfollowed someone",
    AddedReplySuccess: "Successfully replied to the comment",
    LikedCommentSuccess : "Successfully liked a comment",
    UnlikedCommentSuccess : "Successfully unliked a comment"
};

export default StaticStrings;