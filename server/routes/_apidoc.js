// ------------------------------------------------------------------------------------------
// General apiDoc documentation blocks and old history blocks.
// ------------------------------------------------------------------------------------------

// ------------------------------------------------------------------------------------------
// Current Success.
// ------------------------------------------------------------------------------------------


// ------------------------------------------------------------------------------------------
// Current Errors.
// ------------------------------------------------------------------------------------------

/**
 * @apiDefine CreateUserError
 * @apiVersion 0.2.0
 *
 * @apiError NoAccessRight Only authenticated Admins can access the data.
 * @apiError UserNameTooShort Minimum of 5 characters required.
 *
 * @apiErrorExample  Response (example):
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "error": "UserNameTooShort"
 *     }
 */


// ------------------------------------------------------------------------------------------
// Current Permissions.
// ------------------------------------------------------------------------------------------
/**
 * @apiDefine LoginHeader
 * @apiVersion 0.1.0
 * @apiHeader (Header) {String} Authorization Bearer <code>JWT token</code>
*/

/**
 * @apiDefine LoginRequired Require login
 * @apiVersion 0.1.0
 */

/**
 * @apiDefine OwnershipRequired Require Ownership
 * Must own the resource you are requesting
 * @apiVersion 0.1.0
 */

 /**
 * @apiDefine UserRead Require scope "user:read"
 * 
 * Assigned to all Users by default
 *
 * @apiVersion 0.1.0
 */

 /**
 * @apiDefine UserEditContent Require scope "user:edit_content"
 * 
 * Assigned to all Users by default
 *
 * @apiVersion 0.1.0
 */


// ------------------------------------------------------------------------------------------
// History.
// ------------------------------------------------------------------------------------------