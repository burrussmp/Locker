/* eslint-disable max-len */
'use strict';
const StaticStrings = {
  UnauthorizedMissingTokenError: 'UnauthorizedError: Invalid or missing JWT token.',
  UserNotFoundError: 'User not found',
  NotOwnerError: 'User is not authorized to access resource',
  InsufficientPermissionsError: 'Insufficient permissions',
  CannotUpdateHashedPasswordError: 'Updating hashed password not allowed',
  EmptyUpdateError: 'Update object empty',
  ServerErrorTokenNotDecrypted: 'ServerError: Token unable to be decrypted properly or missing appropriate fields',
  InvalidTokenNotCollection: 'ServerError: Incorrect collection attached to token, not valid',
  BadRequestFieldsNeeded: 'The following fields are needed',
  BadRequestInvalidFields: '(Bad request) The following are invalid fields',
  TokenIsNotValid: 'This token is not valid (possible user no longer exists)',
  UnauthorizedAdminRequired: 'This request requires admin access',
  UnknownServerError: 'ServerError: Unknown',
  NotImplementedError: 'Not Implemented',
  AuthErrors: {
    ForgotPasswordMissingEmail: 'Bad Request: Must include an email field to reset password',
    ConfirmPasswordMissingFields: 'Bad Request: Missing required fields',
    UserNotFoundWithEmail: 'Sorry, this email is not associated with an account.',
  },
  LoginErrors: {
    MissingLogin: 'Missing username, phone number, or email',
    MissingPassword: 'Missing password',
    UserNotFound: 'User not found',
    InvalidPassword: 'Invalid password',
    ServerError: 'Sorry, we could not log you in',
  },
  S3ServiceErrors: {
    InvalidImageMimeType: 'Invalid Mime Type, only JPEG and PNG',
    BadRequestWrongKey: 'Bad request: Form-day incorrect field name invalid for media.',
    UploadServerError: 'ServerError: Unable to upload file',
    DeleteServerError: 'ServerError: Unable to delete file',
    RetrieveServerError: 'ServerError: Unable to send file, but it exists in S3',
    BadMediaUploadSuccessfulDelete: 'ServerError: Unable to upload media but clean up S3 worked.',
    BadRequestMissingFile: 'Missing file to upload',
    InvalidMediaMimeType: 'The media being uploaded must be a video or image',
  },
  UserControllerErrors: {
    BadUploadSuccessfulDelete: 'ServerError: Unable to update profile picture but clean up S3 worked.',
    ProfilePhotoNotFound: 'Profile photo not found',
    FollowSelfError: 'Cannot follow yourself',
    UnfollowSelfError: 'Cannot unfollow yourself',
    FollowingMissingID: 'Missing either ID of follower or following. This is actually a server error.',
  },
  MediaModelErrors: {
    KeyRequired: 'S3 file key is required',
    TypeRequired: 'The type is required (e.g Avatar)',
    MimeTypeRequired: 'The mimetype is required (e.g image/png)',
    OriginalNameRequired: 'The original name of the upload is required',
    DescriptionTooLong: 'Description cannot exceed 180 characters',
    UploadedByRequired: 'The ObjectID of the uploader is required',
    UnacceptableType: 'ServerError: Image must be an acceptable type (e.g. Avatar)',
    KeyAlreadyExists: 'ServerError: The S3 key must be unique (and should be)',
    UploadedByTypeRequired: 'ServerError: Must specify an uploaded type (either \'user\' or \'employee\')',
    UploadedByTypeInvalid: 'ServerError: \'uploadedByType\' of media object must be either \'user\' or \'employee\'',
  },
  UserModelErrors: {
    InvalidGender: 'Valid gender is required',
    InvalidPhoneNumber: 'Valid phone number is required',
    InvalidEmail: 'Valid email is required',
    UsernameAlreadyExists: 'Username already exists',
    PhoneNumberAlreadyExists: 'Phone number already exists',
    EmailAlreadyExists: 'Email already exists',
    PhoneNumberRequired: 'Phone number is required',
    PasswordRequired: 'Password is required',
    CognitoUsernameRequired: 'Server Error: Cognito username is required to create a user and should have been automatically filled in',
    UsernameRequired: 'Username is required',
    LastNameRequired: 'Last name is required',
    FirstNameRequired: 'First name is required',
    EmailRequired: 'Email is required',
    UsernameExceedLength: 'Username cannot exceed 32 characterse',
    InvalidUsername: 'Valid alphanumeric username (underscores allowed) is required',
    PasswordTooShort: 'Password length must be > 7',
    PasswordNoNumbers: 'Password must contain at least one numeric character',
    PasswordNoSpecial: 'Password must contain at least one e.g. @, !, $, etc',
    PasswordNoLowercase: 'Password must contain at least one lowercase character',
    PasswordNoUppercase: 'Password must contain at least one uppercase character',
    PasswordUpdateIncorrectError: 'Old password is incorrect',
    PasswordUpdateSame: 'Cannot update with the same old password',
  },
  EmployeeModelErrors: {
    CognitoUsernameRequired: 'Server Error: Cognito username is required for employee',
    RoleRequired: 'Server Error: Must assign a role to a new employee',
    EmailRequired: 'Must provide an email when creating an employee',
    EmailAlreadyExists: 'Employee with that email already exists',
  },
  EmployeeControllerErrors: {
    EmployeeNotFound: 'Employee not found',
    PasswordUpdateSame: 'New password is the same as the old password',
    PasswordUpdateIncorrectError: 'Old password is incorrect',
    MissingRoleType: 'Missing role_type parameter in request body',
    MissingOrganizationId: 'The organizationId parameter is missing from the request body',
    OrganizationNotFound: 'The organizationId parameter does not match any existing organization',
    NotPartOfOrganization: 'Cannot add a user to an organization that you are not a part of',
    OnlyOneAdminAllowed: 'Only 1 admin is allowed to be created',
    ChangeRoleCannotUpdateSuperior: 'Cannot change the role of a higher authorized employee',
    ChangeRoleRequireAdminOrSameOrg: 'Requester and requestee must be a part of the same organization or requester must be admin',
  },
  RBACModelErrors: {
    RoleRequired: 'Server Error: Must assign role attribute when creating new RBAC',
    ResourceRequired: 'A resource is required to define a permission',
    ActionRequired: 'An action is required to define a permission',
    InvalidActionType: 'The action you have specified is invalid',
    LevelRequired: 'Must provide a level for the RBAC (e.g. 0 === Admin)',
    RoleNotFound: 'The role type was not found',
    RoleAlreadyExists: 'A role with this name already exists',
  },
  OrganizationModelErrors: {
    NameRequired: 'Must provide a name for the organization',
    LogoRequired: 'Must provide a logo for the company',
    UrlRequired: 'Must provide a valid URL to the company page',
    NameAlreadyExists: 'An organization already exists with this name',
    URLAlreadyExists: 'An organization already exists with this url',
  },
  OrganizationControllerErrors: {
    NotFoundError: 'Organization not found',
    MissingID: 'Missing parameter "employeeId" in request body',
    EmployeeAlreadyInOrganization: 'This employee is already added to an organization. Please contact support if this is wrong',
  },
  ProductModelErrors: {
    PriceRequired: 'Must provide a price for the product',
    DescriptionRequired: 'Must provide a description for the product',
    NameRequired: 'Must provide a name for the product',
    UrlRequired: 'Must provide a URL to the product',
    ExistsRequired: 'Must check if url exists and appropriately set flag',
    MediaRequired: 'Must provide a main media',
    NegativePrice: 'Cannot have negative price',
    OrganizationRequired: 'Must link the product to an organization',
  },
  ReplyControllerErrors: {
    MissingTextField: 'Missing text field in request body',
  },
  CommentModelErrors: {
    MaxCommentSizeError: 'Text must be less than 300 characters',
    CommentNotFoundError: 'Comment not found',
    ReplyTextRequired: 'The reply text cannot be empty',
    ReplyNotFound: 'Reply not found',
    CommentTextRequired: 'A comment cannot be empty',
  },
  PostModelErrors: {
    TypeRequired: 'Must specify the type',
    MaxCaptionSizeError: 'Descriptions must be less than 300 characters',
    InvalidReaction: 'Unsupported reaction',
    MissingPoster: 'A specific user must post',
    MaxLengthTag: 'A tag cannot exceed 20 characters',
    TagMustBeAlphabetical: 'The tag can only contain uppercase and lowercase letters',
    IncorrectType: 'This type of post is not supported',
    MissingContent: 'This post is missing content',
    PostNotFoundError: 'Post not found',
    PriceNotNonnegative: 'The price must be non-negative',
    MaximumNumberOfTags: 'Too many tags provided (maximum is 7)',
    NoReactionToDelete: 'You have not reacted, so there is no reaction to delete',
    ContentPostErrors: {
      ProductRequired: 'Must link content post to product',
    },
    CreateMissingType: 'Missing \'type\' in request body',

  },
  MediaControllerErrors: {
    MediaNotFound: 'Error requested media not found',
    CannotResizeNotImage: 'Cannot resize media that is not image/png or image/jpeg',
    MediaTypeNotImplementedResize: 'This media type has not been implemented for a resize',
    SizeQueryParameterInvalid: 'Query parameter \'size\' invalid or missing',
    MediaTypeQueryParameterInvalid: 'Query parameter \'media_type\' invalid or missing',

  },
  PostController: {
    UnknownPostType: 'Unknown post type',
    MissingOrInvalidReaction: 'Missing or invalid reaction in request body',
  },
  SignedUpSuccess: 'Successfully signed up!',
  LoggedOutSuccess: 'Logged out',
  UploadProfilePhotoSuccess: 'Successfully uploaded user profile photo',
  RemoveProfilePhotoSuccess: 'Successfully removed profile photo',
  UpdatedPasswordSuccess: 'Successfully updated password',
  AddedFollowerSuccess: 'Following someone new!',
  RemovedFollowerSuccess: 'Successfully unfollowed someone',
  LikedCommentSuccess: 'Successfully liked a comment',
  UnlikedCommentSuccess: 'Successfully unliked a comment',
};

export default StaticStrings;
