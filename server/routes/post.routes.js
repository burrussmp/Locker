import express from 'express';
import postCtrl from '../controllers/post.controller';
import commentCtrl from '../controllers/comment.controller';
import authCtrl from '../controllers/auth.controller';
import permission from '../permissions';

const router = express.Router()

router.param('postId', postCtrl.postByID)
router.param('commentId', commentCtrl.commentByID)
router.param('replyId', commentCtrl.replyByID)

router.route('/api/posts')
  .get(permission.Authorize, postCtrl.listPosts)
  .post(permission.Authorize, postCtrl.createPost)

router.route('/api/posts/:postId')
  .get(permission.Authorize, postCtrl.getPost)
  .put(permission.Authorize, authCtrl.requireOwnership,postCtrl.editPost)
  .delete(permission.Authorize, authCtrl.requireOwnership,postCtrl.deletePost)

router.route('/api/posts/:postId/comments')
  .get(permission.Authorize, postCtrl.listComments)
  .post(permission.Authorize, postCtrl.createComment)

router.route('/api/posts/:postId/reactions')
  .get(permission.Authorize, postCtrl.listReactions)
  .put(permission.Authorize, authCtrl.requireOwnership, postCtrl.changeReaction)
  .delete(permission.Authorize, authCtrl.requireOwnership, postCtrl.deleteReaction)

router.route('/api/posts/:postId/comments/:commentId')
  .get(permission.Authorize, postCtrl.getComment)
  .put(permission.Authorize, authCtrl.requireOwnership,postCtrl.editComment)
  .delete(permission.Authorize, authCtrl.requireOwnership,postCtrl.deleteComment)

router.route('/api/:commentId/replies')
  .get(permission.Authorize, commentCtrl.listReplies)
  .post(permission.Authorize,commentCtrl.createReply)

router.route('/api/:commentId/replies/:replyId')
  .get(permission.Authorize, commentCtrl.getReply)
  .put(permission.Authorize, authCtrl.requireOwnership,commentCtrl.editReply)
  .delete(permission.Authorize, authCtrl.requireOwnership,commentCtrl.deleteReply)

export default router
