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
{
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
}
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
