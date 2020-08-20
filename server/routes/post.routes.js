import express from 'express'
import postCtrl from '../controllers/post.controller'
import permission from '../permissions'

const router = express.Router()

router.param('postId', postCtrl.postByID)

// router.route('/api/posts')
//   .get(permission.Authorize, postCtrl.List)
//   .get(permission.Authorize, postCtrl.Post)

//   router.route('/api/posts/:postId')
//   .get(permission.Authorize, postCtrl.findPost)
//   .put(permission.Authorize, postCtrl.Post)

// router.route('/api/posts/by/:userId')
//   .get(permission.Authorize, postCtrl.listByUser)

// router.route('/api/posts/feed/:userId')
//   .get(permission.Authorize, postCtrl.listNewsFeed)

// router.route('/api/posts/like')
//   .put(permission.Authorize, postCtrl.like)
// router.route('/api/posts/unlike')
//   .put(permission.Authorize, postCtrl.unlike)

// router.route('/api/posts/comment')
//   .put(permission.Authorize, postCtrl.comment)
// router.route('/api/posts/uncomment')
//   .put(permission.Authorize, postCtrl.uncomment)

// router.route('/api/posts/:postId')
//   .delete(permission.Authorize, postCtrl.isPoster, postCtrl.remove)

export default router
