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
 * @apiParam    (Request body)  {String}      [about]         Description of user (Cannot exceed 300 characters)
 * @apiParamExample {json} Request-Example:
 * {
 *  "first_name"    : "John",
 *  "last_name"     : "Doe",
 *  "username"      : "JohnDoe",
 *  "email"         : "John.Doe@gmail.com",
 *  "phone_number"  : "+123456789",
 *  "password"      : "JohnDoeP@ssw@rd123#"
 * }
 * @apiSuccess  (200) {String}    access_token           JWT access token
 * @apiSuccess  (200) {String}    id_token           JWT ID token
 * @apiSuccess  (200) {String}    refresh_token           JWT refresh token
 * @apiSuccess  (200) {ObjectId}  _id        MongoDB ID of user
 *
 * @apiSuccessExample Response (example):
 *     HTTP/1.1 200 OK
{
    "access_token": "eyJraWQiOiJSOGNuYnFxM2YzV0V6Zk94NVRuRE1NYU5CdUZsU1llU0lJVFZNclRRSTJJPSIsImFsZyI6IlJTMjU2In0.eyJzdWIiOiJkNjM5NGM2NS1kZDRiLTQ4MjUtYmRmZi01YWU1ZDNlMGI5MWYiLCJldmVudF9pZCI6ImExNzU4ZTFjLTllZWQtNDE4Mi1iZDM1LTJmNzk4MGM5YjE2NyIsInRva2VuX3VzZSI6ImFjY2VzcyIsInNjb3BlIjoiYXdzLmNvZ25pdG8uc2lnbmluLnVzZXIuYWRtaW4iLCJhdXRoX3RpbWUiOjE2MDAxNzkzMTYsImlzcyI6Imh0dHBzOlwvXC9jb2duaXRvLWlkcC51cy1lYXN0LTEuYW1hem9uYXdzLmNvbVwvdXMtZWFzdC0xX3hyU2xrRDhXdSIsImV4cCI6MTYwMDE4MjkxNiwiaWF0IjoxNjAwMTc5MzE2LCJqdGkiOiIyZGZmNzY4OS1iZDIxLTRlNTUtODVjMS1jM2U0MDEyNDNjMmEiLCJjbGllbnRfaWQiOiI2bmZpNjAyMmhwNDZqZm8yNmJrMGE4M3JjdCIsInVzZXJuYW1lIjoiZGJjYTY4NDUtZDQwMC00ZTM3LWJlNzgtM2JlYjdlYjdhNjNhIn0.ay4VyBuN1F2kWFsMRxJ2_GtMPOKQjFUkmuyjX8Z2JbSO2RixjYsRmnLCeRakI7kXfobHxgLKfYGKUJ8TQBxJuaQrAO2dvN_zjpaq3UF4y-zUZPvzzU0jeY4RlgcPgJErU6OduGNjaSWPLHvVah3jicrBvkPCGDQdaXHXziwrTLaiuHAoIfYtuHV4dNhPxTH0o_GQqMhKFTCy06KJXP96kJSTUTVcsFMGaHR2Pr0WvL9Cya7UHrGugNX4zQ7aRMaxcuKUF6GgmFl6ixuLxOzLkXxoAMOnImqI3R7sBrgOzbQVME08HqHxjb_j4sTPYIM1MAdKir6vy2UH1enHEBLMfw",
    "id_token": "eyJraWQiOiIyeUJmYzhjWjIwVVJrcWdKZ1R4MktvRW5UT3JYTElWYmNwdkltVlVpVXJrPSIsImFsZyI6IlJTMjU2In0.eyJzdWIiOiJkNjM5NGM2NS1kZDRiLTQ4MjUtYmRmZi01YWU1ZDNlMGI5MWYiLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiaXNzIjoiaHR0cHM6XC9cL2NvZ25pdG8taWRwLnVzLWVhc3QtMS5hbWF6b25hd3MuY29tXC91cy1lYXN0LTFfeHJTbGtEOFd1IiwicGhvbmVfbnVtYmVyX3ZlcmlmaWVkIjp0cnVlLCJjb2duaXRvOnVzZXJuYW1lIjoiZGJjYTY4NDUtZDQwMC00ZTM3LWJlNzgtM2JlYjdlYjdhNjNhIiwicHJlZmVycmVkX3VzZXJuYW1lIjoibWF0dGhldzQiLCJhdWQiOiI2bmZpNjAyMmhwNDZqZm8yNmJrMGE4M3JjdCIsImV2ZW50X2lkIjoiYTE3NThlMWMtOWVlZC00MTgyLWJkMzUtMmY3OTgwYzliMTY3IiwidG9rZW5fdXNlIjoiaWQiLCJhdXRoX3RpbWUiOjE2MDAxNzkzMTYsInBob25lX251bWJlciI6IisxNTAyNjg5MTgyMyIsImV4cCI6MTYwMDE4MjkxNiwiaWF0IjoxNjAwMTc5MzE2LCJlbWFpbCI6Im5ld191c2VyM0BnbWFpbC5jb20ifQ.uiQOxEKXjv2zsu89yQUAnWjIJCixFWK4Y_AIZcV3--U3T3OooLnWn9n-2dfNKbH8TscNyN1nfjI6z8FPTRpx0ysu8qcCsUUI6rCC83GDQD1NeDmyrg9yMCmVEnn3fs-jNgQGhjRKK3fA3_VC7JmMrSFQii-rDOnPgY7YhSKNvqRsnI8R3QWUw47A0MyrGPrT4Wq-mZ-IF5i9flLj7_pWDZl0DQlOjTbjRR-xB_CAcfElGog_-ZogXWChXvT0OHHy43DL4r03nipcLms03OWtbtJInbK4pljo1zZqgXxEHL01xuvkQSW356GE1P8aMUIqDHmu-maYkQsS885lAPuu1w",
    "refresh_token": "eyJjdHkiOiJKV1QiLCJlbmMiOiJBMjU2R0NNIiwiYWxnIjoiUlNBLU9BRVAifQ.WpNRmabYPIcOgF3UsUHyPRwsSIqvaahnLAHFErJgiOpzcGvsQBeA9cDhcGPrMSRAV3wpXxvjbJbvIKmsiA1EDBRkEcQC2wSpjPQDEe6syHI2PMKJX2aQhE_WgH574KQEhpjdHKDox4wH6LrOxjuGCiaZtAIPzavp5aOch8M3Y4Otata_VEC2ZNcUo0fDaMuObEVFMQfHSr_UgVjyzft-fcjZ2L06kbkNdmsUXn-YZ0jfn-rV4x_YBuhUmr_JuhXbbpEkfLWA5VbzeYJ2nvPDr_CeI-SFfhgCoD__TViN7NiLl1kNYXJ5dN41jkpp-5-R3noJQA3cglItYdeG8eNR-A.wfiYYQC4Ipz6VIxu.EEk89oAYxpxF3E-PoOG-fwtB7bReJcrV_lPUk0j4j4JDGGluGIpTBB5amn6-W6AFphwY_EcrPRngrB48cPO5FIAj919MrHrufPsL0rsHaUMgd1n5WZe8Ra8e9F5dlWA8u35UfYgVO-GqF_DaIMb3wL2wPGA-dewt9PQzOYXhAbvAEb2649qHJ5Kni5sd1X3cOE29gMLoeN7bTPRAVytsXH3XEfAmxk4gaD2ju3ooCiyVGlPNO_WbG5le7uNL4xjR-lw7n6fgjcX33vNt9zfmz5mmpW9kV-YeBXF5N8Q_LLAbBfMFgXTJYZSE-Q4m7dUncMo4c-GIWnUXmq3Cw6GFtwwsl8n7Oda1gMGnj7LFr7bLMS2HiHctrGQ_5Uwz20vGIk5_kiO6u0Vhy6XOfocqsQ2A3qrJgYycVGiOaJjsgrZliTu0tW7RyRkihqCWIE9BMU-YB3hTm7pynDiuqpZ-cfGD4pmPkrKDvYv2U64N7ZfoioQjo2Kbma1RX1eYPqVJDWJXATWCTppYddRlla7UneIt8zmjFDhwH1tijR0sl3r1kmYzJbpqJ-YwQLGWjNy0M_40Fy4fEs---EZ1KKXE22UvwUZ9fzRQZ6aF2SCkdZCE18CpdVgCT-xtwRsTlmzxxmbqAIaVrsL92Rz4mCYpA-QVWb6UhlqgNbAmzg21ui8QNgajfL1GgVTkHxlqVJV15o7JvPvp8S7csNk9nnUms2Vg2YOhAbBMXWFXbxNzvQfxF4Ah4HdeDAbnaFEkk4iPYhQgehAkUxc_WZdWt03aQ9V3y2b6Y6Ar6j96ZQZ7YCPW_aubUYwPhM9Y39lT8p0jI1w47_NSDgQxJ9XT80NOIEH91sZOEN66qrFFdEFAi-naKAhUc0-V6w98vaojQu_g3pEgsLJmOL8zsNRVpxXAxiDzgMFzGRsc3tWhQVZ0QSBjH2Go0kAcYELx3eSrRK0fjwIUnYXRsJZn8JyhDflrxOaZo8TgMTJx8BHQkbQbCY9z2P1_W1CrNipewQaS5RloTTTFZCkTJCUsq_h99706wU6p5k1pNtgzOFULA1MDatm3nWOg1yKtdsxn89HZ_Vks1waUdWqIJwH2Yg3O3-SnMYnQMoxtb5a8ZjNmv9F49MMRreNHUxWp427vmV1Pk75BK_EoExUo5X6onjuEu9DgVgqQlCygdDsBlmVNnI0PNrLjz8ojxCY9A7df_VTZjDN1HpPlDq271VKCQGsi-51A9Y2xJ43ZU2taiSbZ64IbcTRmAFJ0pZJYWgN9vNXoRxzwha8KS58DmeVfNAg4TjQWL9-QdScFU0nnLJfIzHVMkZ1O1KBpFZJBOmdmAQ.BsLVaQWZUM32Oq6XVhh_Vw",
    "_id": "5f60cc7422add441148a35ea"
}
 * @apiError (4xx) 400 Missing required fields, invalid fields, non-unique username/email/phone number, etc.
 * @apiErrorExample Invalid username:
 *     HTTP/1.1 400 Internal Server Error
 *     {
 *       "error": "Valid alphanumeric username (underscores allowed) is required"
 *     }
 * @apiErrorExample Invalid field:
 *     HTTP/1.1 400 Internal Server Error
        {
            "error": "Bad request: The following are invalid fields "bad_key""
        }
 * @apiErrorExample Non-Unique Constraint:
 *     HTTP/1.1 400 Internal Server Error
        {
            "error": "Email already exists"
        }
 */

/**
 * @api {get} /api/users/:userId Get Specific User Info
 * @apiDescription Retrieve data from a specific user queried by :userId path parameter in URL
 * @apiName GetApiUsersbyID
 * @apiGroup User
* @apiUse LoginHeader
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
 * @api {post} /api/users/:userId/avatar Update Profile Photo
 * @apiDescription Updates the user"s profile photo by storing it in an AWS S3 bucket.
 * @apiName PostApiUsersUserIdAvatar
 * @apiGroup User
* @apiUse LoginHeader
 * @apiVersion 0.1.0
 * @apiPermission LoginRequired
 * @apiUse LoginError
 * @apiPermission OwnershipRequired
 * @apiUse OwnershipError
 * @apiPermission UserEditContent
 * @apiUse PermissionError
 * @apiParam    (Form Data)  {File}        media        <code>Required</code>Profile image to upload
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
 * @api {delete} /api/users/:userId/avatar Delete Profile Photo
 * @apiDescription Permanently removes user profile photo
 * @apiName DeleteApiUsersUserIdAvatar
 * @apiGroup User
* @apiUse LoginHeader
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
 * @api {get} /api/users/:userId/avatar Get Profile Photo
 * @apiDescription Retrieve the profile photo from AWS S3 bucket
 * @apiName GetApiUsersUserIdAvatar
 * @apiGroup User
 * @apiUse LoginHeader
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
 * @api {delete} /api/users/:userId/ Delete User
 * @apiDescription Permanently removes a user and all their information (i.e. profile photo form S3, any followers/followings)
 * @apiName DeleteApiUsersUserId
 * @apiGroup User
* @apiUse LoginHeader
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
 * @api {put} /api/users/:userId/ Update Profile Information
 * @apiDescription Update profile of a specific user and returns the updated profile to that user.
 * @apiName PutApiUsersUserId
 * @apiGroup User
* @apiUse LoginHeader
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
 * @apiParam    (Request body)  {String}      [about]         Description of user (Cannot exceed 300 characters) * @apiSuccess (200) {Object} DeletedUser The user that has been deleted.
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
 * @api {put} /api/users/:userId/password Update Password
 * @apiDescription Update profile of a specific user and returns the updated profile to that user.
 * @apiName PutApiUsersUserIdPassword
 * @apiGroup User
* @apiUse LoginHeader
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
 * @apiError (4xx) 400 Bad Request: New password is too short, the same as the old password, old_password doesn"t match the current password, etc.
 */

/**
 * @api {get} /api/users/:userId/follow Get Followers/Followings
 * @apiDescription Retrieve a list of :userId"s followers and following.
 * @apiName GetApiUsersUserIdFollow
 * @apiGroup User
* @apiUse LoginHeader
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
 * @api {put} /api/users/:userId/follow Follow Someone
 * @apiDescription The requester follows user with ID :userId
 * @apiName PutApiUsersUserIdFollow
 * @apiGroup User
* @apiUse LoginHeader
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
 * @api {delete} /api/users/:userId/follow Unfollow Someone
 * @apiDescription The requester unfollows user with ID :userId
 * @apiName DeleteApiUsersUserIdUnFollow
 * @apiGroup User
* @apiUse LoginHeader
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