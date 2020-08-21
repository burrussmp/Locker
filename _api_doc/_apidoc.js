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


/**
 * @apiDefine CommentNotFound
 * @apiVersion 0.1.0
 *
 * @apiError (4xx) 404 Comment not found
 * @apiErrorExample CommentNotFound:
 *     HTTP/1.1 404 Resource Not Found
        {
            "error": "Comment not found"
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

  /**
 * @apiDefine CommentRead Require scope "comment:read"
 * 
 * Assigned to all Users by default
 *
 * @apiVersion 0.1.0
 */

/**
 * @apiDefine CommentEditContent Require scope "comment:edit_content"
 * 
 * Assigned to all Users by default
 *
 * @apiVersion 0.1.0
 */

/**
 * @apiDefine CommentDelete Require scope "comment:delete"
 * 
 * Assigned to all Users by default
 *
 * @apiVersion 0.1.0
 */

   /**
 * @apiDefine PostRead Require scope "post:read"
 * 
 * Assigned to all Users by default
 *
 * @apiVersion 0.1.0
 */

/**
 * @apiDefine PostEditContent Require scope "post:edit_content"
 * 
 * Assigned to all Users by default
 *
 * @apiVersion 0.1.0
 */

/**
 * @apiDefine PostDelete Require scope "post:delete"
 * 
 * Assigned to all Users by default
 *
 * @apiVersion 0.1.0
 */

 /**
 * @apiDefine PostCreate Require scope "post:create"
 * 
 * Assigned to all Users by default
 *
 * @apiVersion 0.1.0
 */

 /**
 * @apiDefine PostInteract Require scope "post:interact"
 * 
 * Assigned to all Users by default
 *
 * @apiVersion 0.1.0
 */

// ------------------------------------------------------------------------------------------
// History.
// ------------------------------------------------------------------------------------------