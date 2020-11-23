import express from 'express';
import postCtrl from '../controllers/post.controller';
import commentCtrl from '../controllers/comment.controller';
import authCtrl from '../controllers/auth.controller';
import permission from '../permissions';

const PostPermissions = permission.PostPermissions;
const CommentPermissions = permission.CommentPermissions;

const router = express.Router()

router.param('postId', postCtrl.postByID)
router.param('commentId', commentCtrl.commentByID)
router.param('replyId', commentCtrl.replyByID)



router.route('/api/posts')
  .get(permission.Authorize([PostPermissions.Read]), postCtrl.listPosts)
  .post(permission.Authorize([PostPermissions.Create]), postCtrl.createPost)

router.route('/api/posts/:postId')
  .get(permission.Authorize([PostPermissions.Create]), postCtrl.getPost)
  .put(permission.Authorize([PostPermissions.EditContent]), authCtrl.requireOwnership,postCtrl.editPost)
  .delete(permission.Authorize([PostPermissions.Delete]), authCtrl.requireOwnership,postCtrl.deletePost)

router.route('/api/:postId/comments')
  .get(permission.Authorize([PostPermissions.Read, CommentPermissions.Read]), postCtrl.listComments)
  .post(permission.Authorize([PostPermissions.EditContent, CommentPermissions.Create]), postCtrl.createComment)

  // test all below
router.route('/api/posts/:postId/reaction')
  .get(permission.Authorize([PostPermissions.Read]), postCtrl.getReaction)
  .put(permission.Authorize([PostPermissions.EditContent, PostPermissions.Interact]), postCtrl.changeReaction)
  .delete(permission.Authorize([PostPermissions.EditContent, CommentPermissions.Interact]), postCtrl.removeReaction)

router.route('/api/comments/:commentId')
  .get(permission.Authorize([PostPermissions.Read, CommentPermissions.Read]), postCtrl.getComment)
  .delete(permission.Authorize([PostPermissions.EditContent, CommentPermissions.Delete]), authCtrl.requireOwnership,postCtrl.deleteComment)


router.route('/api/:commentId/replies')
  .get(permission.Authorize([PostPermissions.Read, CommentPermissions.Read]), commentCtrl.listReplies)
  .post(permission.Authorize([PostPermissions.EditContent, CommentPermissions.EditContent]),commentCtrl.createReply)

router.route('/api/:commentId/likes')
  .put(permission.Authorize([PostPermissions.EditContent, CommentPermissions.EditContent]), commentCtrl.likeComment)
  .delete(permission.Authorize([PostPermissions.EditContent, CommentPermissions.EditContent]), commentCtrl.unlikeComment)

router.route('/api/:commentId/replies/:replyId')
  .get(permission.Authorize([PostPermissions.Read, CommentPermissions.Read]), commentCtrl.getReply)
  .delete(permission.Authorize([PostPermissions.EditContent, CommentPermissions.Delete]), authCtrl.requireOwnership,commentCtrl.deleteReply)
  //.put(permission.Authorize, authCtrl.requireOwnership,commentCtrl.editReply) //  IMPLEMENTED BUT TAKEN OUT


router.route('/api/:commentId/replies/:replyId/likes')
  .put(permission.Authorize([PostPermissions.EditContent, CommentPermissions.Interact]), commentCtrl.likeReply)
  .delete(permission.Authorize([PostPermissions.EditContent, CommentPermissions.Interact]), commentCtrl.unlikeReply)

export default router
