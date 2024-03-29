/**
 * @api {get} /api/media/:key Get Media from S3
 * @apiDescription Edit one of your posts. The :key path parameter is the file identifier in the S3 bucket. You can also use this to
 * dynamically resize the image by providing the query parameter size.
 * @apiName GetMediaKey
 * @apiGroup Miscellaneous
 * @apiVersion 0.1.0
 * @apiUse LoginHeader
 * @apiPermission LoginRequired
 * @apiUse LoginError
 * @apiPermission none
 * @apiParam    (Query Parameter)  {String}      size        Retrieves a small, medium, large, or xlarge version of an image
 * @apiSuccess  (200) {Stream} media The response object is a stream of the media that has been retrieved.
 * @apiError (4xx) 404 Media not found
 * @apiError (4xx) 400 Invalid or missing media_type when wanting size / media type cannot be resized
 * @apiError (4xx) 500 Server Error
 */

