import express from 'express'
import userCtrl from '../controllers/user.controller'
import authCtrl from '../controllers/auth.controller'
import postCtrl from '../controllers/post.controller'

const router = express.Router()

router.route('/api/posts/new/:userId')
  .post(authCtrl.requireLogin, postCtrl.create)

router.route('/api/posts/photo/:postId')
  .get(postCtrl.photo)

router.route('/api/posts/by/:userId')
  .get(authCtrl.requireLogin, postCtrl.listByUser)

router.route('/api/posts/feed/:userId')
  .get(authCtrl.requireLogin, postCtrl.listNewsFeed)

router.route('/api/posts/like')
  .put(authCtrl.requireLogin, postCtrl.like)
router.route('/api/posts/unlike')
  .put(authCtrl.requireLogin, postCtrl.unlike)

router.route('/api/posts/comment')
  .put(authCtrl.requireLogin, postCtrl.comment)
router.route('/api/posts/uncomment')
  .put(authCtrl.requireLogin, postCtrl.uncomment)

router.route('/api/posts/:postId')
  .delete(authCtrl.requireLogin, postCtrl.isPoster, postCtrl.remove)

router.param('userId', userCtrl.userByID)
router.param('postId', postCtrl.postByID)

export default router
