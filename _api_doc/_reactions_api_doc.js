/**
 * @api {put} /api/posts/:postId/reaction React to Post
 * @apiDescription React to a specific post
 * @apiVersion 0.1.0
 * @apiName PostAPIPostsPostIdReaction
 * @apiGroup Post
 * @apiUse LoginHeader
 * @apiPermission LoginRequired
 * @apiUse LoginError
 * @apiPermission PostEditContent
 * @apiPermission PostInteract
 * @apiUse PermissionError
 * @apiParam (Request body) {String}   reaction    Options: "like", "love", "laugh", "surprise", "mad", or "sad"
 * @apiSuccess (200) {ObjectID} _id      The ID of the post
 * @apiSuccessExample Response (example):
 * HTTP/1.1 200 OK
    {
        "_id": "5f400fb18b012a65ef46044b",
    }
 * @apiUse PostNotFound
 * @apiError (4xx) 400 Invalid reaction
 * @apiErrorExample InvalidReaction: 
 * HTTP/1.1 400 Bad Request
    {
        "error":  "Missing or invalid reaction in request body"
    }
 */

"Missing or invalid reaction in request body"

 /**
 * @api {delete} /api/posts/:postId/reaction Remove Reaction
 * @apiDescription Delete your reaction
 * @apiVersion 0.1.0
 * @apiName DeleteAPIPostsPostIdReaction
 * @apiGroup Post
 * @apiUse LoginHeader
 * @apiPermission LoginRequired
 * @apiUse LoginError
 * @apiPermission PostEditContent
 * @apiPermission PostInteract
 * @apiUse PermissionError
 * @apiSuccess (200) {ObjectID} _id      The ID of the post
 * @apiSuccessExample Response (example):
 * HTTP/1.1 200 OK
    {
        "id": "5f400fb18b012a65ef46044b",
    }
 * @apiUse PostNotFound
 * @apiError (4xx) 404 Attempted to remove a reaction you have not made
 * @apiErrorExample NoReaction: 
 *  HTTP/1.1 404 Resource Not Found
    {
        "error":  "You have not reacted, so there is no reaction to delete"
    }
 */

 /**
 * @api {get} /api/posts/:postId/reaction Get Reactions of Post
 * @apiDescription See aggregate view of all the reactions of the post
 * @apiVersion 0.1.0
 * @apiName GetAPIPostsPostIdReaction
 * @apiGroup Post
 * @apiUse LoginHeader
 * @apiPermission LoginRequired
 * @apiUse LoginError
 * @apiPermission PostRead
 * @apiUse PermissionError
 * @apiSuccess (200) {Number}   like        The number of likes
 * @apiSuccess (200) {Number}   love        The number of loves
 * @apiSuccess (200) {Number}   laugh       The number of laughs
 * @apiSuccess (200) {Number}   surprise    The number of surprises
 * @apiSuccess (200) {Number}   mad         The number of mads
 * @apiSuccess (200) {Number}   sad         The number of sads
 * @apiSuccess (200) {Boolean|String}  selected False if requester has not reacted, else it shows their reaction (e.g. "like")   
 * @apiSuccessExample Response (example):
 * HTTP/1.1 200 OK
    {
        "selected": "like",
        "like": 423,
        "love": 1232,
        "laugh": 903,
        "surprise": 23,
        "mad": 43,
        "sad": 12
    }
 * @apiUse PostNotFound
 */