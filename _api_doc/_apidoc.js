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
 * @apiDefine LoginError
 * @apiVersion 0.1.0
 *
 * @apiError (4xx) 401 Invalid or missing token in Authorization header (Authorization: bearer <token>)
 * @apiErrorExample NotLoggedIn:
 *     HTTP/1.1 401 Unauthorized
        {
            "error": "UnauthorizedError: Invalid or missing JWT token."
        }
 * 
 */

/**
 * @apiDefine PermissionError
 * @apiVersion 0.1.0
 *
 * @apiError (4xx) 403 Unauthorized
 * @apiErrorExample BadPermissions:
 *     HTTP/1.1 403 Forbidden
        {
            "error": "Insufficient permissions"
        }
 */

 /**
 * @apiDefine OwnershipError
 * @apiVersion 0.1.0
 *
 * @apiError (4xx) 403 Unauthorized
 * @apiErrorExample NotOwner:
 *     HTTP/1.1 403 Forbidden
        {
            "error": "User is not authorized to access resource"
        }
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

  /**
 * @apiDefine UserDelete Require scope "user:delete"
 * 
 * Assigned to all Users by default
 *
 * @apiVersion 0.1.0
 */

/**
 * @apiDefine UserChangePassword Require scope "user:change_password"
 * 
 * Assigned to all Users by default
 *
 * @apiVersion 0.1.0
 */


// ------------------------------------------------------------------------------------------
// History.
// ------------------------------------------------------------------------------------------