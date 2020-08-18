/**
 * @api {get} /api/users List all users
 * @apiDescription List all Locker users
 * @apiName GetApiUsers
 * @apiGroup User
 * @apiVersion 0.1.0
 * @apiPermission none
 * @apiSuccess (200) {Object[]}   profiles            List of all user profiles
 * @apiSuccess (200) {ObjectId}     profiles._id      MongoDB ID
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
 * @apiError (5xx) InternalServerError Unable to retrieve users from database (e.g. unable to connect or overloaded)
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 500 Internal Server Error
 *     {
 *       "error": "Timeout of 2000ms exceeded"
 *     }
 * 
 */

 /**
 * @api {post} /api/users Create new user
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
 * @apiParam    (Request body)  {String}      [about]         Description of user
 * @apiParam    (Request body)  {File}        [profile_photo] Profile image
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
 * @apiError (4xx) BadRequest Missing required fields, invalid fields, non-unique username/email/phone number, etc.
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 400 Internal Server Error
 *     {
 *       "error": "A valid username is required"
 *     }
 * 
 */

 /**
 * @api {get} /api/users/:userId Read specific user's data
 * @apiDescription Retrieve data from a specific user queried by ObjectID
 * @apiName GetApiUsersbyID
 * @apiGroup User
 * @apiVersion 0.1.0
 * @apiUse LoginHeader
 * @apiPermission LoginRequired
 * @apiPermission UserRead 
 * @apiSuccess (200) {ObjectId}     _id                 MongoDB ID
 * @apiSuccess (200) {String}       first_name          First name of user
 * @apiSuccess (200) {String}       last_name           Last name of user 
 * @apiSuccess (200) {String}       phone_number        Phone number of user
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
        "following": [],
        "followers": [],
        "_id": "5f3ac37951772102cbb2ce58",
        "username": "JohnDoe",
        "first_name": "John",
        "last_name": "Doe",
        "createdAt": "2020-08-17T17:50:49.777Z",
        "updatedAt": "2020-08-17T17:50:49.777Z"
    }
 * @apiError (401) NotAuthorized Invalid or missing token in Authorization header (Authorization: bearer <token>)
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 401 Unauthorized
        {
            "error": "UnauthorizedError: Invalid or missing JWT token."
        }
 * 
 * @apiError (403) Forbidden Insufficient permissions.
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 403 Forbidden
        {
            "error": "Insufficient permissions"
        }
 * 
 */