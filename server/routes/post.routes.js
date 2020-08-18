import express from 'express'
import userCtrl from '../controllers/user.controller'
import authCtrl from '../controllers/auth.controller'
import postCtrl from '../controllers/post.controller'
import permission from '../permissions'

const router = express.Router()

router.param('userId', userCtrl.userByID)
router.param('postId', postCtrl.postByID)

router.route('/api/posts/new/:userId')
  .post(permission.Authorize, postCtrl.create)

router.route('/api/posts/photo/:postId')
  .get(permission.Authorize,postCtrl.photo)

router.route('/api/posts/by/:userId')
  .get(permission.Authorize, postCtrl.listByUser)

router.route('/api/posts/feed/:userId')
  .get(permission.Authorize, postCtrl.listNewsFeed)

router.route('/api/posts/like')
  .put(permission.Authorize, postCtrl.like)
router.route('/api/posts/unlike')
  .put(permission.Authorize, postCtrl.unlike)

router.route('/api/posts/comment')
  .put(permission.Authorize, postCtrl.comment)
router.route('/api/posts/uncomment')
  .put(permission.Authorize, postCtrl.uncomment)

router.route('/api/posts/:postId')
  .delete(permission.Authorize, postCtrl.isPoster, postCtrl.remove)

export default router
