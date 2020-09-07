/**
 * @api {post} /auth/login Login
 * @apiDescription Login to Locker account
 * @apiName PostAuthLogin
 * @apiGroup Auth
 * @apiVersion 0.1.0
 * @apiPermission none
 * @apiParam    (Request body)  {String}      login        <code>Required</code> Username, email address, or phone number
 * @apiParam    (Request body)  {String}      password     <code>Required</code> Password
 * @apiParamExample {json} Request-Example:
 * {
 *  "login"    : "JohnDoe",
 *  "password" : "JohnDoeP@ssw@rd123#"
 * }
 * @apiSuccess  (200) {String}    token           JWT token
 * @apiSuccess  (200) {Object}    user            User object
 * @apiSuccess  (200) {ObjectId}  user._id        MongoDB ID of user
 * @apiSuccess  (200) {String}    user.username   Username of user
 * @apiSuccess  (200) {String}    user.email      Email of user
 *
 * @apiSuccessExample Response (example):
 *     HTTP/1.1 200 OK
 *     {
 *       "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1ZjNhYjg4MDg1NmQyNTYxZWZlNzRmYTEiLCJwZXJtaXNzaW9ucyI6WyJwb3N0OnJlYWQiLCJwb3N0OmludGVyYWN0IiwidXNlcjplZGl0X2NvbnRlbnQiLCJ1c2VyOmRlbGV0ZSIsInVzZXI6cmVhZCJdLCJpYXQiOjE1OTc2ODM4NTZ9.gh2c-KHWUamR87k9kUR7yBDyL4NB3LROxrAEDnrDvLo",
 *       "user": {
 *           "_id": "5f3ab880856d2561efe74fa1",
 *           "username": "JohnDoe",
 *           "email" : "johndoe@gmail.com",
 *       }
 *     }
 * @apiError (4xx) 400 Missing username, phone number, email.
 * @apiError (4xx) 400 Missing password
 * @apiError (4xx) 401 Invalid password
 * @apiError (4xx) 404 User not found
 * @apiError (5xx) 500 Server unable to login user
 * @apiErrorExample MissingLoginInfo:
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "error": "Missing username, phone number, or email"
 *     }
  * @apiErrorExample MissingPassword:
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "error": "Missing password"
 *     }
 * @apiErrorExample InvalidPassword:
 *     HTTP/1.1 401 Unauthorized
 *     {
 *       "error": "Invalid password"
 *     }
 * @apiErrorExample UserNotFound:
 *     HTTP/1.1 404 Not Found
 *     {
 *       "error": "User not found"
 *     }
 * @apiErrorExample ServerError:
 *     HTTP/1.1 500 Internal Server Error
 *     {
 *       "error": "Server unable to login user"
 *     }
 */

 /**
 * @api {get} /auth/logout Logout
 * @apiDescription Removes JWT token from Cookies to log out.
 * @apiName GetAuthLogout
 * @apiGroup Auth
 * @apiVersion 0.1.0
 * @apiPermission none
 * @apiSuccess  (200) {String}    message   "Logged out"
 *
 * @apiSuccessExample Response (example):
 *     HTTP/1.1 200 OK
 *     {
            "message": "Logged out"
        }
 */