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
 * @apiSuccess (200) {Boolean}   data.liked  Whether or not the requester liked this reply or not
 * @apiSuccessExample Response (example):
  HTTP/1.1 200 OK
  [
    {
      text: 'new text',
      postedBy: '5f65880f1c64cf1cd2a91610',
      createdAt: '2020-09-19T04:24:50.244Z',
      _id: '5f6588121c64cf1cd2a91619',
      likes: 0,
      liked: false
    },
    {
      text: 'new text',
      postedBy: '5f6588101c64cf1cd2a91611',
      createdAt: '2020-09-19T04:24:50.247Z',
      _id: '5f6588121c64cf1cd2a9161a',
      likes: 6,
      liked: true
    }
  ]
* @apiUse CommentNotFound
 */


 /**
 * @api {put} /api/comments/:commentId/likes Like
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
 * @api {delete} /api/comments/:commentId/likes Unlike
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
 * @api {get} /api/posts/:postId/comments List Post Comments
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
 * @apiSuccess (200) {Object[]} data            A list of the comments on the post
 * @apiSuccess (200) {ObjectID} data._id        The ID of the comment
 * @apiSuccess (200) {Date}     data.createdAt  The timestamp of when the comment was posted
 * @apiSuccess (200) {postedBy} data.postedBy   Who posted the comment (the user ID)
 * @apiSuccess (200) {Number}   data.likes      The number of likes
 * @apiSuccess (200) {liked}    data.liked      Whether or not the caller liked the comment

 * @apiSuccessExample Response (example):
  HTTP/1.1 200 OK
  [
    {
      text: 'What the heck @someperson comments',
      postedBy: 5f65925c10264630c624150b,
      createdAt: 2020-09-19T05:08:48.350Z,
      _id: 5f65926010264630c6241516,
      likes: 0,
      liked: false
    },
    {
      text: 'New comment 1',
      postedBy: 5f65925c10264630c624150b,
      createdAt: 2020-09-19T05:08:48.358Z,
      _id: 5f65926010264630c6241517,
      likes: 0,
      liked: false
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