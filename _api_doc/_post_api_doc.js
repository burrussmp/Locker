 /**
 * @api {get} /api/posts List All Posts
 * @apiDescription Retrieve a list of all the posts IDs
 * @apiName GetPosts
 * @apiGroup Post
* @apiUse LoginHeader
 * @apiVersion 0.1.0
 * @apiPermission LoginRequired
 * @apiUse LoginError
 * @apiPermission PostRead
 * @apiUse PermissionError
 * @apiSuccess  (200) {Object[]} body A list of all posts
 * @apiSuccess  (200) {ObjectID} body[index]._id ID of post
 * @apiSuccess  (200) {Date} body[index].createdAt Timestamp of when the post was created
 *
 * @apiSuccessExample Response (example):
 *     HTTP/1.1 200 OK
    [
        {
            "_id": "5f4142d2df64933395456dde",
            "createdAt": "2020-08-22T16:07:46.915Z"
        },
        {
            "_id": "5f4142d3df64933395456de1",
            "createdAt": "2020-08-22T16:07:47.174Z"
        }
    ]
 */

 /**
  * @api {post} /api/posts?type=ContentPost Create Content Post
  * @apiDescription Create a new content post
  * @apiName PostApiPosts
  * @apiGroup Post
  * @apiVersion 0.1.0
  * @apiUse LoginHeader
  * @apiVersion 0.1.0
  * @apiPermission LoginRequired
  * @apiUse LoginError
  * @apiPermission PostCreate
  * @apiUse PermissionError
  * @apiParam    (Form Data)     {File}          media      <code>Required</code> An image or video file to accompany the post
  * @apiParam    (Form Data)     {Number}        price      <code>Required</code> Price (Non-Negative)
  * @apiParam    (Form Data)     {String}        [caption]  Description of the post (MaxLength: 300 characters)
  * @apiParam    (Form Data)     {String}      [tags]     Comma delimited tags (Max: 7, MaxLength: 20 characters per tag, must be alphabetical)
  * @apiSuccess  (200) {ObjectID} ID The ID of the newly created post
  *
  * @apiSuccessExample Response (example):
  *   HTTP/1.1 200 OK
  *   {
  *      "_id" : "5f4142d3df64933395456de1"
  *   }
  * @apiError (4xx) 400 Missing required fields, invalid fields (price greater than zero, too many tags, etc)
  */

 /**
 * @api {get} /api/posts/:postId Get Specific Post
 * @apiDescription Retrieves the information of a specific post
 * @apiName GetApiPostsPostID
 * @apiGroup Post
 * @apiVersion 0.1.0
 * @apiUse LoginHeader
 * @apiVersion 0.1.0
 * @apiPermission LoginRequired
 * @apiPermission OwnershipRequired
 * @apiUse LoginError
 * @apiPermission PostRead
 * @apiUse PermissionError
 * @apiSuccess  (200) {String}      type        The type of post (e.g. "ContentPost")
 * @apiSuccess  (200) {Object}      content     The content of the post (varies based on type)
 * @apiSuccess  (200) {String}      caption     The ID of the newly created post
 * @apiSuccess  (200) {String[]}    tags        The ID of the newly created post
 * @apiSuccess  (200) {ObjectID}    postedBy    The ID of the newly created post
 * @apiSuccess  (200) {Date}        createdAt   The ID of the newly created post
 * @apiSuccess  (200) {Date}        updatedAt   The ID of the newly created post

 * @apiSuccessExample Response (example):
    {
        "caption": "Check out the new shoe!",
        "tags": ["shoe", "designer"],
        "_id": "5f4155c1284bd74c053c2ffe",
        "type": "ContentPost",
        "content": {
            "price": 99.99,
            "media": {
                "key": "2998472058f3455c6843ece354b90af0_ContentPost",
                "mimetype": "image/png"
            }
        },
        "postedBy": "5f4155c0284bd74c053c2ff9",
        "createdAt": "2020-08-22T17:28:33.161Z",
        "updatedAt": "2020-08-22T17:28:33.161Z"
    }
 * @apiUse PostNotFound
*/

 /**
  * @api {put} /api/posts/:postId Edit Post
  * @apiDescription Edit one of your posts
  * @apiName EditApiPostsPostid
  * @apiGroup Post
  * @apiVersion 0.1.0
  * @apiUse LoginHeader
  * @apiVersion 0.1.0
  * @apiPermission LoginRequired
  * @apiUse LoginError
  * @apiPermission PostEditContent
  * @apiUse PermissionError
  * @apiParam    (Request Body)     {String}      [caption]  Caption to show below the post (MaxLength: 300 characters)
  * @apiParam    (Request Body)     {String}      [tags]     Comma delimited tags (Max: 7, MaxLength: 20 characters per tag, must be lphabetical)
  * @apiSuccess  (200) {ObjectID} ID The ID of the newly updated post
  *
  * @apiSuccessExample Response (example):
  *   HTTP/1.1 200 OK
  *   {
  *      "_id" : "5f4142d3df64933395456de1"
  *   }
  * @apiError (4xx) 400 Invalid fields (too many tags, too long of a caption, etc.)
  */
