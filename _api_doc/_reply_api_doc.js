  /**
 * @api {get} /api/:commentId/replies?access_token=YOUR_ACCESS_TOKEN List replies
 * @apiDescription For the provided comment, list all the replies
 * @apiName GetApiCommentIdReplies
 * @apiGroup Comment
 * @apiVersion 0.1.0
 * @apiPermission LoginRequired
 * @apiUse LoginError
 * @apiPermission PostRead
 * @apiPermission CommentRead
 * @apiUse PermissionError
 * @apiSuccess (200) {Object[]}   Replies  A list of all the replies
 * @apiSuccess (200) {Object[]}   likes    A list of who liked a response
 * @apiSuccess (200) {Object[]}   Replies  A list of all the replies
 * @apiSuccess (200) {Object[]}   Replies  A list of all the replies
 * @apiSuccess (200) {Object[]}   Replies  A list of all the replies
 * @apiSuccess (200) {Object[]}   Replies  A list of all the replies
 * @apiSuccessExample Response (example):
 *     HTTP/1.1 200 OK
{
[
  {
    likes: [ 5f3f47e0cc6b0174b9cf8fe4, 5f3f47e0cc6b0174b9cf8fe6 ],
    _id: 5f3f47e0cc6b0174b9cf8fe8,
    text: 'new text',
    postedBy: 5f3f47e0cc6b0174b9cf8fe2,
    updatedAt: 2020-08-21T04:04:48.831Z,
    createdAt: 2020-08-21T04:04:48.831Z
  },
  {
    likes: [ 5f3f47e0cc6b0174b9cf8fe6, 5f3f47e0cc6b0174b9cf8fe2 ],
    _id: 5f3f47e0cc6b0174b9cf8fe9,
    text: 'new text',
    postedBy: 5f3f47e0cc6b0174b9cf8fe4,
    updatedAt: 2020-08-21T04:04:48.838Z,
    createdAt: 2020-08-21T04:04:48.838Z
  }
]
}
 * @apiError (4xx) 404 Bad Request: "Comment not found"
 */

db.comments.aggregate([
    { $match : {_id : "5f3f4caee2a9f77d4a4bee62"}}
]);
   { $match: { status: "A" } },
   { $group: { _id: "$cust_id", total: { $sum: "$amount" } } }
])
db.comments.aggregate([
    { $match: { "_id" : ObjectId("5f3f4caee2a9f77d4a4bee62") } },
    { $project : {"total_likes": { $size: "$likes" }}},
    { $merge: { "into": "comments", "on": "_id", "whenMatched": "replace", "whenNotMatched": "insert" } }
])
//   ,  { $project: { likes: 1 } } /* select the tokens field as something we want to "send" to the next command in the chain */
//   , { $unwind: '$likes' } /* this converts arrays into unique documents for counting */
//   , { $group: { /* execute 'grouping' */
//           _id: { token: '$likes' } /* using the 'token' value as the _id */
//         , count: { $sum: 1 } /* create a sum value */
//       }
//     }
]);