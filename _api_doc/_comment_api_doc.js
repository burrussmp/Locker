  /**
 * @api {get} /api/:commentId/replies List Replies
 * @apiDescription For the provided comment, list all the replies
 * @apiName GetApiCommentIdReplies
 * @apiGroup Comment
* @apiUse LoginHeader
 * @apiVersion 0.1.0
 * @apiPermission LoginRequired
 * @apiUse LoginError
 * @apiPermission PostRead
 * @apiPermission CommentRead
 * @apiUse PermissionError
 * @apiSuccess (200) {Object[]}   data  A list of all the replies
 * @apiSuccess (200) {String}   data.text    The reply text
 * @apiSuccess (200) {ObjectID} data.postedBy The ID of the replier
 * @apiSuccess (200) {Date}     data.createdAt The timestamp the reply was posted 
 * @apiSuccess (200) {Number}   data.likes  Number of likes
 * @apiSuccess (200) {Boolean}   data.liked  Whether or not the requester liked this response or not
 * @apiSuccessExample Response (example):
 *     HTTP/1.1 200 OK
[
  {
    text: "This is a new reply",
    postedBy: 5f3ff3c98edf7e37fc3a5810,
    createdAt: 2020-08-21T16:18:17.617Z,
    likes: 0,
    liked: false
  }
]
          ✓ Correctly posts reply
[
  {
    text: "This is a new reply",
    postedBy: 5f3ff3c98edf7e37fc3a581d,
    createdAt: 2020-08-21T16:18:17.678Z,
    likes: 0,
    liked: false
  }
]
 * @apiUse CommentNotFound
 */


 /**
 * @api {put} /api/:commentId/likes Like
 * @apiDescription Like a comment
 * @apiName PutApiCommentIdLikes
 * @apiGroup Comment
* @apiUse LoginHeader
 * @apiVersion 0.1.0
 * @apiPermission LoginRequired
 * @apiUse LoginError
 * @apiPermission PostEditContent
 * @apiPermission CommentEditContent
 * @apiUse PermissionError
 * @apiSuccess (200) {String} message "Successfully liked a comment"
 * @apiSuccessExample Response (example):
 *     HTTP/1.1 200 OK
  {
    "message" : "Successfully liked a comment"
  }
 * @apiUse CommentNotFound
 * @apiError (4xx) 400 Bad Request: Text not included
 */

/**
 * @api {delete} /api/:commentId/likes Unlike
 * @apiDescription Unlike a comment
 * @apiName DeleteApiCommentIdLikes
 * @apiGroup Comment
* @apiUse LoginHeader
 * @apiVersion 0.1.0
 * @apiPermission LoginRequired
 * @apiUse LoginError
 * @apiPermission PostEditContent
 * @apiPermission CommentEditContent
 * @apiUse PermissionError
 * @apiSuccess (200) {String} message "Successfully unliked a comment"
 * @apiSuccessExample Response (example):
 *     HTTP/1.1 200 OK
  {
    "message" : "Successfully unliked a comment"
  }
 * @apiUse CommentNotFound
 * @apiError (4xx) 400 Bad Request: Text not included
 */

 /**
 * @api {post} /api/:postId/comments Create a Comment
 * @apiDescription Comment on a post
 * @apiName PostApiPostIdComments
 * @apiGroup Comment
 * @apiUse LoginHeader
 * @apiVersion 0.1.0
 * @apiPermission LoginRequired
 * @apiUse LoginError
 * @apiPermission PostEditContent
 * @apiPermission CommentEditContent
 * @apiUse PermissionError
 * @apiParam (200) {String}   text    Comment text
 * @apiSuccess (200) {ObjectID} _id The ID of the newly created comment
 * @apiSuccessExample Response (example):
 *     HTTP/1.1 200 OK
  {
    "_id" : "5f3ff3c98edf7e37fc3a581d"
  }
 * @apiError (4xx) 400 Bad Request: Text not included, all whitespace, or too long (MAX: 300 characters)
 */

  /**
 * @api {get} /api/:postId/comments List Post Comments
 * @apiDescription Comment on a post
 * @apiName GetApiPostIdComments
 * @apiGroup Post
 * @apiUse LoginHeader
 * @apiVersion 0.1.0
 * @apiPermission LoginRequired
 * @apiUse LoginError
 * @apiPermission PostRead
 * @apiPermission CommentRead
 * @apiUse PermissionError
 * @apiSuccess (200) {Object[]} data                  A list of the comments on the post
 * @apiSuccess (200) {ObjectID} data._id       The ID of the comment
 * @apiSuccess (200) {Date}     data.createdAt The timestamp of when the comment was posted
 * @apiSuccessExample Response (example):
 *  HTTP/1.1 200 OK
    [
        {
          "_id": "5f41ed74c025ae6116189890",
          "createdAt": "2020-08-23T04:15:48.491Z"
        },
        {
          "_id": "5f41ed7fc025ae6116189891",
          "createdAt": "2020-08-23T04:15:59.824Z"
        }
    ]
*/
 
  /**
 * @api {get} /api/comments/:commentId Get Specific Comment
 * @apiDescription Retrieve a specific comment
 * @apiName GetApiCommentsCommentID
 * @apiGroup Comment
 * @apiUse LoginHeader
 * @apiVersion 0.1.0
 * @apiPermission LoginRequired
 * @apiUse LoginError
 * @apiPermission PostRead
 * @apiPermission CommentRead
 * @apiUse PermissionError
 * @apiSuccess (200) {Object} Comment See below for details
 * @apiSuccessExample Response (example):
* HTTP/1.1 200 OK
    {
      "_id": "5f41f6056bb02a7b13f269e9",
      "text": "Does it come in other colors?",
      "postedBy": "5f41f5b16bb02a7b13f269e2",
      "createdAt": "2020-08-23T04:52:21.125Z",
      "likes": 0,
      "liked": false
    }
 * @apiUse CommentNotFound
*/

  /**
 * @api {delete} /api/comments/:commentId Delete Comment
 * @apiDescription Delete a specific comment
 * @apiName DeleteApiCommentsCommentID
 * @apiGroup Comment
 * @apiUse LoginHeader
 * @apiVersion 0.1.0
 * @apiPermission LoginRequired
 * @apiPermission OwnershipRequired
 * @apiUse LoginError
 * @apiPermission PostEditContent
 * @apiPermission CommentDelete
 * @apiUse PermissionError
 * @apiSuccess (200) {ObjectID} ID  The ID of the deleted comment
 * @apiSuccessExample Response (example):
* HTTP/1.1 200 OK
  {
    "_id": "5f41f6056bb02a7b13f269e9"
  }
 * @apiUse CommentNotFound
*/