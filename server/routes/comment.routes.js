/* eslint-disable new-cap */
/* eslint-disable max-len */
import express from 'express';
import commentCtrl from '@server/controllers/comment.controller';
import authCtrl from '@server/controllers/auth.controller';
import permission from '@server/permissions';

const router = express.Router();

router.param('commentId', commentCtrl.commentByID);
router.param('replyId', commentCtrl.replyByID);

const CommentPermissions = permission.CommentPermissions;

/**
 ** Comment API
 */
router.route('/api/comments/:commentId')
    .get(authCtrl.authorize([CommentPermissions.Read]), commentCtrl.getComment)
    .delete(authCtrl.authorize([CommentPermissions.Delete]), authCtrl.requireOwnership, commentCtrl.deleteComment);

router.route('/api/comments/:commentId/likes')
    .put(authCtrl.authorize([CommentPermissions.Interact]), commentCtrl.likeComment)
    .delete(authCtrl.authorize([CommentPermissions.Interact]), commentCtrl.unlikeComment);

/**
 ** Reply API
 */
router.route('/api/comments/:commentId/replies')
    .get(authCtrl.authorize([CommentPermissions.Read]), commentCtrl.listReplies)
    .post(authCtrl.authorize([CommentPermissions.EditContent]), commentCtrl.createReply);

router.route('/api/comments/:commentId/replies/:replyId')
    .get(authCtrl.authorize([CommentPermissions.Read]), commentCtrl.getReply)
    .delete(authCtrl.authorize([CommentPermissions.Interact]), authCtrl.requireOwnership, commentCtrl.deleteReply);
// .put(authCtrl.authorize, authCtrl.requireOwnership,commentCtrl.editReply) //  IMPLEMENTED BUT TAKEN OUT

router.route('/api/comments/:commentId/replies/:replyId/likes')
    .put(authCtrl.authorize([CommentPermissions.Interact]), commentCtrl.likeReply)
    .delete(authCtrl.authorize([CommentPermissions.Interact]), commentCtrl.unlikeReply);

export default router;
