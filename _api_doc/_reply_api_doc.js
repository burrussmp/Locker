/**
 * @api {post} /api/:commentId/replies Create a Reply
 * @apiDescription Adds a reply to a comment
 * @apiName PostApiCommentIdReplies
 * @apiGroup Reply
* @apiUse LoginHeader
 * @apiVersion 0.1.0
 * @apiPermission LoginRequired
 * @apiUse LoginError
 * @apiPermission PostEditContent
 * @apiPermission CommentEditContent
 * @apiUse PermissionError
 * @apiParam    (Request body)  {String}      text        <code>Required</code> Reply (Cannot exceed 300 characters or be empty)
 * @apiSuccess (id) {ObjectID} id The ID of the reply that was created
 * @apiSuccessExample Response (example):
 *     HTTP/1.1 200 OK
  {
    "_id" : "5f400fb18b012a65ef46044b"
  }
 * @apiUse CommentNotFound
 * @apiUse ReplyNotFound
 * @apiError (4xx) 400 Bad Request: Text not included or too long
 * @apiErrorExample TooLong:
      HTTP/1.1 400 Bad Request
        {
            "error": "Text must be less than 300 characters"
        }
 */

 /**
 * @api {get} /api/:commentId/replies/:replyId Get Specific Reply
 * @apiDescription Retrieves a specific reply
 * @apiName GetApiCommentIdRepliesReplyId
 * @apiGroup Reply
* @apiUse LoginHeader
 * @apiVersion 0.1.0
 * @apiPermission LoginRequired
 * @apiUse LoginError
 * @apiPermission PostRead
 * @apiPermission CommentRead
 * @apiUse PermissionError
 * @apiSuccess (200) {String}   text    The reply text
 * @apiSuccess (200) {ObjectID} postedBy The ID of the replier
 * @apiSuccess (200) {Date}     createdAt The timestamp the reply was posted 
 * @apiSuccess (200) {Number}   likes  Number of likes
 * @apiSuccess (200) {Boolean}  Whether or not the requester has liked this reply or not
 * @apiSuccessExample Response (example):
 *     HTTP/1.1 200 OK
  {
    text: "What a reply!",
    postedBy: "5f400fb18b012a65ef46044b",
    createdAt: "2020-08-21T18:17:21.586Z",
    likes: 0,
    liked: false
  }
 * @apiUse CommentNotFound
 */

 /**
 * @api {put} /api/:commentId/replies/:replyId Edit Reply
 * @apiIgnore Removed but implemented
 * @apiDescription Edit one of your replies
 * @apiName PutApiCommentIdRepliesReplyId
 * @apiGroup Reply
* @apiUse LoginHeader
 * @apiVersion 0.1.0
 * @apiPermission LoginRequired
 * @apiPermission OwnershipRequired
 * @apiUse OwnershipError
 * @apiUse LoginError
 * @apiPermission PostEditContent
 * @apiPermission CommentEditContent
 * @apiUse PermissionError
 * @apiParam (Request body) {String}   text    <code>Required</code> Reply (Cannot exceed 300 characters or be empty)
 * @apiSuccess (200) {String}   text    The updated reply text
 * @apiSuccess (200) {ObjectID} id      The ID of the reply
 * @apiSuccessExample Response (example):
 *     HTTP/1.1 200 OK
  {
    text: "Updated Text",
    "_id": "5f400fb18b012a65ef46044b",
  }
 * @apiUse CommentNotFound
 * @apiUse ReplyNotFound
 */

  /**
 * @api {delete} /api/:commentId/replies/:replyId Delete Reply
 * @apiDescription Delete one of your replies
 * @apiName DeleteApiCommentIdRepliesReplyId
 * @apiGroup Reply
* @apiUse LoginHeader
 * @apiVersion 0.1.0
 * @apiPermission LoginRequired
 * @apiPermission OwnershipRequired
 * @apiUse OwnershipError
 * @apiUse LoginError
 * @apiPermission PostEditContent
 * @apiPermission CommentEditContent
 * @apiUse PermissionError
 * @apiSuccess (200) {ObjectID} id The ID of the reply
 * @apiSuccessExample Response (example):
 *     HTTP/1.1 200 OK
  {
    "_id": "5f400fb18b012a65ef46044b",
  }
 * @apiUse CommentNotFound
 * @apiUse ReplyNotFound
 */

   /**
 * @api {put} /api/:commentId/replies/:replyId/likes Like
 * @apiDescription Like a reply
 * @apiName PutApiCommentIdRepliesReplyIdLikes
 * @apiGroup Reply
* @apiUse LoginHeader
 * @apiVersion 0.1.0
 * @apiPermission LoginRequired
 * @apiUse LoginError
 * @apiPermission PostEditContent
 * @apiPermission CommentInteract
 * @apiUse PermissionError
 * @apiSuccess (200) {ObjectID} id The ID of the reply
 * @apiSuccessExample Response (example):
 *     HTTP/1.1 200 OK
  {
    "_id": "5f400fb18b012a65ef46044b",
  }
 * @apiUse CommentNotFound
 * @apiUse ReplyNotFound
 */

   /**
 * @api {delete} /api/:commentId/replies/:replyId/likes Unlike
 * @apiDescription Unlike a reply
 * @apiName DeleteApiCommentIdRepliesReplyIdLikes
 * @apiGroup Reply
* @apiUse LoginHeader
 * @apiVersion 0.1.0
 * @apiPermission LoginRequired
 * @apiUse LoginError
 * @apiPermission PostEditContent
 * @apiPermission CommentInteract
 * @apiUse PermissionError
 * @apiSuccess (200) {ObjectID} id The ID of the reply
 * @apiSuccessExample Response (example):
 *     HTTP/1.1 200 OK
  {
    "_id": "5f400fb18b012a65ef46044b",
  }
 * @apiUse CommentNotFound
 * @apiUse ReplyNotFound
 */