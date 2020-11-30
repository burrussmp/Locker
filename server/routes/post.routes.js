/* eslint-disable new-cap */
/* eslint-disable max-len */
import express from 'express';
import postCtrl from '../controllers/post.controller';
import commentCtrl from '../controllers/comment.controller';
import authCtrl from '../controllers/auth.controller';
import permission from '../permissions';

const PostPermissions = permission.PostPermissions;
const CommentPermissions = permission.CommentPermissions;

const router = express.Router();

router.param('postId', postCtrl.postByID);
router.param('commentId', commentCtrl.commentByID);
router.param('replyId', commentCtrl.replyByID);

router.route('/api/posts')
    .get(authCtrl.authorize([PostPermissions.Read]), postCtrl.listPosts)
    .post(authCtrl.authorize([PostPermissions.Create]), postCtrl.createPost); // can only post from enterprise login right now

router.route('/api/posts/:postId')
    .get(authCtrl.authorize([PostPermissions.Create]), postCtrl.getPost)
    .put(authCtrl.authorize([PostPermissions.EditContent]), authCtrl.requireOwnership, postCtrl.editPost)
    .delete(authCtrl.authorize([PostPermissions.Delete]), authCtrl.requireOwnership, postCtrl.deletePost);

router.route('/api/:postId/comments')
    .get(authCtrl.authorize([PostPermissions.Read, CommentPermissions.Read]), postCtrl.listComments)
    .post(authCtrl.authorize([PostPermissions.EditContent, CommentPermissions.Create]), postCtrl.createComment);

// test all below
router.route('/api/posts/:postId/reaction')
    .get(authCtrl.authorize([PostPermissions.Read]), postCtrl.getReaction)
    .put(authCtrl.authorize([PostPermissions.EditContent, PostPermissions.Interact]), postCtrl.changeReaction)
    .delete(authCtrl.authorize([PostPermissions.EditContent, CommentPermissions.Interact]), postCtrl.removeReaction);

router.route('/api/comments/:commentId')
    .get(authCtrl.authorize([PostPermissions.Read, CommentPermissions.Read]), postCtrl.getComment)
    .delete(authCtrl.authorize([PostPermissions.EditContent, CommentPermissions.Delete]), authCtrl.requireOwnership, postCtrl.deleteComment);


router.route('/api/:commentId/replies')
    .get(authCtrl.authorize([PostPermissions.Read, CommentPermissions.Read]), commentCtrl.listReplies)
    .post(authCtrl.authorize([PostPermissions.EditContent, CommentPermissions.EditContent]), commentCtrl.createReply);

router.route('/api/:commentId/likes')
    .put(authCtrl.authorize([PostPermissions.EditContent, CommentPermissions.EditContent]), commentCtrl.likeComment)
    .delete(authCtrl.authorize([PostPermissions.EditContent, CommentPermissions.EditContent]), commentCtrl.unlikeComment);

router.route('/api/:commentId/replies/:replyId')
    .get(authCtrl.authorize([PostPermissions.Read, CommentPermissions.Read]), commentCtrl.getReply)
    .delete(authCtrl.authorize([PostPermissions.EditContent, CommentPermissions.Delete]), authCtrl.requireOwnership, commentCtrl.deleteReply);
// .put(authCtrl.authorize, authCtrl.requireOwnership,commentCtrl.editReply) //  IMPLEMENTED BUT TAKEN OUT


router.route('/api/:commentId/replies/:replyId/likes')
    .put(authCtrl.authorize([PostPermissions.EditContent, CommentPermissions.Interact]), commentCtrl.likeReply)
    .delete(authCtrl.authorize([PostPermissions.EditContent, CommentPermissions.Interact]), commentCtrl.unlikeReply);

export default router;
