/**
 * @api {get} /api/users List All Users
 * @apiDescription Fetch a list of Locker users
 * @apiName GetApiUsers
 * @apiGroup User
 * @apiVersion 0.1.0
 * @apiPermission none
 * @apiSuccess (200) {Object[]}   profiles            List of all user profiles
 * @apiSuccess (200) {ObjectId}   profiles._id        MongoDB ID
 * @apiSuccess (200) {String}     profiles.username   Username
 * @apiSuccess (200) {Date}       profile.updatedAt   Timestamp of last update to user profile
 * @apiSuccess (200) {Date}       profile.createdAt   Timestamp of when user was created  
 * @apiSuccessExample Response (example):
 *     HTTP/1.1 200 OK
 *     [
 *      {
 *        "_id": "5f34821b0c46f63b28831230",
 *        "username": "userA",
 *        "updated": "2020-08-12T23:58:19.944Z",
 *        "created": "2020-08-12T23:58:19.944Z"
 *      },
 *      :
 *      {
 *        "_id": "5f34821c0c46f63b28831231",
 *        "username": "userB",
 *        "updated": "2020-08-12T23:58:20.137Z",
 *        "created": "2020-08-12T23:58:20.137Z"
 *      },
 *     ]
 * @apiError (5xx) 500 Unable to retrieve users from database (e.g. unable to connect or overloaded)
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 500 Internal Server Error
 *     {
 *       "error": "Timeout of 2000ms exceeded"
 *     }
 * 
 */

 /**
 * @api {post} /api/users Sign Up
 * @apiDescription Sign in a new user to Locker
 * @apiName PostApiUsers
 * @apiGroup User
 * @apiVersion 0.1.0
 * @apiPermission none
 * @apiParam    (Request body)  {String}      username        <code>Required</code> Username (unique, alphanumeric (underscore allowed), at most 32 characters)
 * @apiParam    (Request body)  {String}      email           <code>Required</code> Email unique, valid email address)
 * @apiParam    (Request body)  {String}      phone_number    <code>Required</code> Phone number (unique, valid phone number)
 * @apiParam    (Request body)  {String}      first_name      <code>Required</code> First name
 * @apiParam    (Request body)  {String}      last_name       <code>Required</code> Last name
 * @apiParam    (Request body)  {String}      password        <code>Required</code> Password (at least 7 characters; at least 1 number; at least one of @, !, #, $, % or ^; at least 1 uppercase letter)
 * @apiParam    (Request body)  {Date}        [date_of_birth] Date of birth
 * @apiParam    (Request body)  {String}      [gender]        Gender
 * @apiParam    (Request body)  {String}      [about]         Description of user (Cannot exceed 120 characters)
 * @apiParamExample {json} Request-Example:
 * {
 *  "first_name"    : "John",
 *  "last_name"     : "Doe",
 *  "username"      : "JohnDoe",
 *  "email"         : "John.Doe@gmail.com",
 *  "phone_number"  : "502-673-3231",
 *  "password"      : "JohnDoeP@ssw@rd123#"
 * }
 * @apiSuccess  (200) {String} SignedUp Successfully signed up! 
 *
 * @apiSuccessExample Response (example):
 *     HTTP/1.1 200 OK
 *      {
 *        "message": "Successfully signed up!"
 *      }
 * @apiError (4xx) 400 Missing required fields, invalid fields, non-unique username/email/phone number, etc.
 * @apiErrorExample Invalid username:
 *     HTTP/1.1 400 Internal Server Error
 *     {
 *       "error": "A valid username is required"
 *     }
 * @apiErrorExample Invalid field:
 *     HTTP/1.1 400 Internal Server Error
        {
            "error": "Bad request: The following are invalid fields 'bad_key'"
        }
 * @apiErrorExample Non-Unique Constraint:
 *     HTTP/1.1 400 Internal Server Error
        {
            "error": "Email already exists"
        }
 */

 /**
 * @api {get} /api/users/:userId?access_token=YOUR_ACCESS_TOKEN Get Specific User Info
 * @apiDescription Retrieve data from a specific user queried by :userId path parameter in URL
 * @apiName GetApiUsersbyID
 * @apiGroup User
 * @apiVersion 0.1.0
 * @apiPermission LoginRequired
 * @apiUse LoginError
 * @apiPermission UserRead
 * @apiUse PermissionError
 * @apiSuccess (200) {ObjectId}     _id                 MongoDB ID
 * @apiSuccess (200) {String}       about               About the user
 * @apiSuccess (200) {String}       first_name          First name of user
 * @apiSuccess (200) {String}       last_name           Last name of user 
 * @apiSuccess (200) {String}       username            Username of user 
 * @apiSuccess (200) {Object[]}     following           Array of who user followers
 * @apiSuccess (200) {ObjectId}     following._id       MongoDB ID of user following
 * @apiSuccess (200) {String}       following._username Username of user following 
 * @apiSuccess (200) {Object[]}     followers           Array of followers of user
 * @apiSuccess (200) {ObjectId}     followers._id       MongoDB ID of follower
 * @apiSuccess (200) {String}       followers._username Username of follower 
 * @apiSuccess (200) {Date}         updatedAt           Timestamp of last update to user profile
 * @apiSuccess (200) {Date}         createdAt           Timestamp of when user was created  
 * @apiSuccessExample Response (example):
 *     HTTP/1.1 200 OK
    {
        "about" :   "Hi I am John Doe!"
        "following": [],
        "followers": [],
        "_id": "5f3ac37951772102cbb2ce58",
        "username": "JohnDoe",
        "first_name": "John",
        "last_name": "Doe",
        "createdAt": "2020-08-17T17:50:49.777Z",
        "updatedAt": "2020-08-17T17:50:49.777Z"
    }
 */

 /**
 * @api {post} /api/users/:userId/avatar?access_token=YOUR_ACCESS_TOKEN Update Profile Photo
 * @apiDescription Updates the user's profile photo by storing it in an AWS S3 bucket.
 * @apiName PostApiUsersUserIdAvatar
 * @apiGroup User
 * @apiVersion 0.1.0
 * @apiPermission LoginRequired
 * @apiUse LoginError
 * @apiPermission OwnershipRequired
 * @apiUse OwnershipError
 * @apiPermission UserEditContent
 * @apiUse PermissionError
 * @apiParam    (Form Data)  {File}        image        <code>Required</code>Profile image to upload
 * @apiSuccess (200) {String} message      Successfully uploaded user profile photo
 * @apiSuccessExample Response (example):
 *     HTTP/1.1 200 OK
    {
        "message" :  "Successfully uploaded user profile photo"
    }
 
 * @apiError (4xx) 400 No file selected
 * @apiErrorExample MissingFile:
 *     HTTP/1.1 400 Bad Request
        {
            "error": "Missing file to upload"
        }
 * 
 * @apiError (4xx) 422 Not an image file
 * @apiErrorExample UnprocessableEntity:
 *     HTTP/1.1 422 Unprocessable Entity
        {
            "error": "Invalid Mime Type, only JPEG and PNG"
        }
 * 
 */

  /**
 * @api {delete} /api/users/:userId/avatar?access_token=YOUR_ACCESS_TOKEN Delete Profile Photo
 * @apiDescription Permanently removes user profile photo
 * @apiName DeleteApiUsersUserIdAvatar
 * @apiGroup User
 * @apiVersion 0.1.0
 * @apiPermission LoginRequired
 * @apiUse LoginError
 * @apiPermission OwnershipRequired
 * @apiUse OwnershipError
 * @apiPermission UserEditContent
 * @apiUse PermissionError
 * @apiSuccess (200) {String} message      Successfully removed profile photo
 * @apiSuccessExample Response (example):
 *     HTTP/1.1 200 OK
    {
        "message" :  "Successfully removed profile photo"
    }
 * @apiError (4xx) 404 No profile photo to delete
 * @apiErrorExample ResourceNotFound:
 *     HTTP/1.1 404 Resource Not Found
        {
            "error": "Profile photo not found"
        }
 * 
 * @apiError (5xx) 503 Unable to remove image from S3 bucket 
 * @apiError (5xx) 500 Unable to query DB for user. 
 */

  /**
 * @api {get} /api/users/:userId/avatar?access_token=YOUR_ACCESS_TOKEN Get Profile Photo
 * @apiDescription Retrieve the profile photo from AWS S3 bucket
 * @apiName GetApiUsersUserIdAvatar
 * @apiGroup User
 * @apiVersion 0.1.0
 * @apiPermission LoginRequired
 * @apiUse LoginError
 * @apiPermission UserRead
 * @apiUse PermissionError
 * @apiSuccess (200) {Stream} Image The profile photo is streamed in the HTTP response.
 * @apiError (4xx) 404 Profile not found in S3.
 * @apiError (5xx) 500 ServerError: Unable to send file, but it exists in S3
 * @apiError (5xx) 500 Unable to query DB for user. 
 */

   /**
 * @api {delete} /api/users/:userId/?access_token=YOUR_ACCESS_TOKEN Delete User
 * @apiDescription Permanently removes a user and all their information (i.e. profile photo form S3, any followers/followings)
 * @apiName DeleteApiUsersUserId
 * @apiGroup User
 * @apiVersion 0.1.0
 * @apiPermission LoginRequired
 * @apiUse LoginError
 * @apiPermission OwnershipRequired
 * @apiUse OwnershipError
 * @apiPermission UserDelete
 * @apiUse PermissionError
 * @apiSuccess (200) {Object} DeletedUser The user that has been deleted.
 * @apiSuccessExample Response (example):
 *     HTTP/1.1 200 OK
 {
    "permissions": [
        "post:read",
        "post:interact",
        "user:edit_content",
        "user:delete",
        "user:read"
    ],
    "gender": "",
    "about": "",
    "following": [],
    "followers": [],
    "_id": "5f3dcd97832746181006b1eb",
    "username": "JohnDoe",
    "phone_number": "000-111-2222",
    "first_name": "John",
    "last_name": "Doe",
    "email": "a@mail.com",
    "createdAt": "2020-08-20T01:10:47.626Z",
    "updatedAt": "2020-08-20T01:10:47.626Z",
    "__v": 0
}
 * @apiError (5xx) 500 Unable to remove user
 */

   /**
 * @api {put} /api/users/:userId/?access_token=YOUR_ACCESS_TOKEN Update Profile Information
 * @apiDescription Update profile of a specific user and returns the updated profile to that user.
 * @apiName PutApiUsersUserId
 * @apiGroup User
 * @apiVersion 0.1.0
 * @apiPermission LoginRequired
 * @apiUse LoginError
 * @apiPermission OwnershipRequired
 * @apiUse OwnershipError
 * @apiPermission UserEditContent
 * @apiUse PermissionError
 * @apiParam    (Request body)  {String}      [username]        Username (unique, alphanumeric (underscore allowed), at most 32 characters)
 * @apiParam    (Request body)  {String}      [email]           Email unique, valid email address)
 * @apiParam    (Request body)  {String}      [phone_number]    Phone number (unique, valid phone number)
 * @apiParam    (Request body)  {String}      [first_name]      First name
 * @apiParam    (Request body)  {String}      [last_name]       Last name
 * @apiParam    (Request body)  {Date}        [date_of_birth] Date of birth
 * @apiParam    (Request body)  {String}      [gender]        Gender
 * @apiParam    (Request body)  {String}      [about]         Description of user (Cannot exceed 120 characters) * @apiSuccess (200) {Object} DeletedUser The user that has been deleted.
 * @apiSuccessExample Response (example):
 *     HTTP/1.1 200 OK
{
    "permissions": [
        "post:read",
        "post:interact",
        "user:edit_content",
        "user:delete",
        "user:read"
    ],
    "gender": "",
    "about": "",
    "following": [],
    "followers": [],
    "_id": "5f3dd0cf4a3c392049ed1ed8",
    "username": "AnUpdatedUsername",
    "phone_number": "000-111-2222",
    "first_name": "John",
    "last_name": "Doe",
    "email": "a@mail.com",
    "createdAt": "2020-08-20T01:24:31.076Z",
    "updatedAt": "2020-08-20T01:25:08.140Z",
    "__v": 0
}
 * @apiError (4xx) 422 Invalid fields were provided.
 * @apiErrorExample UnprocessableEntity: 
 *     HTTP/1.1 422 Unprocessable Entity
        {
            "error": "(Bad request) The following are invalid fields..."
        }
 * @apiError (5xx) 400 Invalid update. The fields are likely not correct (see parameter requirements).
 */

   /**
 * @api {put} /api/users/:userId/password?access_token=YOUR_ACCESS_TOKEN Update Password
 * @apiDescription Update profile of a specific user and returns the updated profile to that user.
 * @apiName PutApiUsersUserIdPassword
 * @apiGroup User
 * @apiVersion 0.1.0
 * @apiPermission LoginRequired
 * @apiUse LoginError
 * @apiPermission OwnershipRequired
 * @apiUse OwnershipError
 * @apiPermission UserChangePassword
 * @apiUse PermissionError
 * @apiParam    (Request body)  {String}      password        <code>Required</code> Password (at least 7 characters; at least 1 number; at least one of @, !, #, $, % or ^; at least 1 uppercase letter)
 * @apiParam    (Request body)  {String}      old_password    <code>Required</code> Must match old password
 * @apiSuccess (200) {String} message "Successfully updated password"
 * @apiSuccessExample Response (example):
 *     HTTP/1.1 200 OK
{
    "message": "Successfully updated password"
}
 * @apiError (4xx) 422 Invalid Fields: Either missing required fields or including additional.
 * @apiErrorExample UnprocessableEntity: 
 *     HTTP/1.1 422 Unprocessable Entity
        {
            "error": "(Bad request) The following are fields are required old_password"
        }
 * @apiError (4xx) 400 Bad Request: New password is too short, the same as the old password, old_password doesn't match the current password, etc.
 */

/**
 * @api {get} /api/users/:userId/follow?access_token=YOUR_ACCESS_TOKEN Get Followers/Followings
 * @apiDescription Retrieve a list of :userId's followers and following.
 * @apiName GetApiUsersUserIdFollow
 * @apiGroup User
 * @apiVersion 0.1.0
 * @apiPermission LoginRequired
 * @apiUse LoginError
 * @apiPermission UserRead
 * @apiUse PermissionError
 * @apiSuccess (200) {Object[]}     following           Array of who user followers
 * @apiSuccess (200) {ObjectID}     following._id       MongoDB ID of user following
 * @apiSuccess (200) {String}       following._username Username of user following 
 * @apiSuccess (200) {Object[]}     followers           Array of followers of user
 * @apiSuccess (200) {ObjectID}     followers._id       MongoDB ID of follower
 * @apiSuccess (200) {String}       followers._username Username of follower 
 * @apiSuccessExample Response (example):
 *     HTTP/1.1 200 OK
        {
            "following": [
                {
                    "_id": "5f3e184ad4df2d2ab0d5f91b",
                    "username": "new_user"
                }
            ],
            "followers": [
                {
                    "_id": "5f3e183dd4df2d2ab0d5f919",
                    "username": "John"
                },
            ]
        }
 * @apiError (4xx) 422 Bad Request: Unable to fetch list of followers/following
 */

 /**
 * @api {put} /api/users/:userId/follow?access_token=YOUR_ACCESS_TOKEN Follow Someone
 * @apiDescription The requester follows user with ID :userId
 * @apiName PutApiUsersUserIdFollow
 * @apiGroup User
 * @apiVersion 0.1.0
 * @apiPermission LoginRequired
 * @apiUse LoginError
 * @apiPermission UserEditContent
 * @apiUse PermissionError
 * @apiSuccess (200) {String} Message "Following someone new!"
 * @apiSuccessExample Response (example):
 *     HTTP/1.1 200 OK
{
    "message": "Following someone new!"
}
 * @apiError (4xx) 400 Bad Request: Missing ID (Really a Server error you should never see)
 * @apiError (4xx) 422 Bad Request: Cannot follow self
 */

  /**
 * @api {delete} /api/users/:userId/follow?access_token=YOUR_ACCESS_TOKEN Unfollow Someone
 * @apiDescription The requester unfollows user with ID :userId
 * @apiName DeleteApiUsersUserIdUnFollow
 * @apiGroup User
 * @apiVersion 0.1.0
 * @apiPermission LoginRequired
 * @apiUse LoginError
 * @apiPermission UserEditContent
 * @apiUse PermissionError
 * @apiSuccess (200) {String} Message "Successfully unfollowed someone"
 * @apiSuccessExample Response (example):
 *     HTTP/1.1 200 OK
{
    "message": "Successfully unfollowed someone"
}
 * @apiError (4xx) 400 Bad Request: Missing ID (Really a Server error you should never see)
 * @apiError (4xx) 422 Bad Request: Cannot unfollow self
 */