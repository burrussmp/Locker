 /**
  * @api {get} /api/media/:key Get Media from S3
  * @apiDescription Edit one of your posts. The :key path parameter is the file identifier in the S3 bucket
  * @apiName GetMediaKey
  * @apiGroup Miscellaneous
  * @apiVersion 0.1.0
  * @apiUse LoginHeader
  * @apiPermission LoginRequired
  * @apiUse LoginError
  * @apiPermission none
  * @apiSuccess  (200) {Stream} media The response object is a stream of the media that has been retrieved.
  * @apiError (4xx) 404 Media not found
  * @apiError (4xx) 500 Server Error
  */

//  db.posttest.aggregate([
//     { $unwind : "$comments" },
//     { $group : {
//       _id : "$_id",
//       username : { $first : "$username" },
//       text : { $first : "$text" },
//       comments : { $push : "$comments" },
//       hasComments : { $max : { $eq : [ "$comments.username", "User1" ] } }
//     }},
//     { $project : { _id : false } }
//   ])