/* eslint-disable new-cap */
/* eslint-disable max-len */
import express from 'express';
import postCtrl from '../controllers/post.controller';
import authCtrl from '../controllers/auth.controller';
import permission from '../permissions';

const PostPermissions = permission.PostPermissions;
const CommentPermissions = permission.CommentPermissions;

const router = express.Router();

router.param('postId', postCtrl.postByID);

router.route('/api/posts')
    .get(authCtrl.authorize([PostPermissions.Read]), postCtrl.listPosts)
    .post(authCtrl.authorize([PostPermissions.Create]), postCtrl.createPost);

router.route('/api/posts/:postId')
    .get(authCtrl.authorize([PostPermissions.Read]), postCtrl.getPost)
    .put(authCtrl.authorize([PostPermissions.EditContent]), authCtrl.requireOwnership, postCtrl.editPost)
    .delete(authCtrl.authorize([PostPermissions.Delete]), authCtrl.requireOwnership, postCtrl.deletePost);

router.route('/api/:postId/comments')
    .get(authCtrl.authorize([CommentPermissions.Read]), postCtrl.listPostComments)
    .post(authCtrl.authorize([CommentPermissions.Create]), postCtrl.createPostComment);


router.route('/api/posts/:postId/reaction')
    .get(authCtrl.authorize([PostPermissions.Read]), postCtrl.getReaction)
    .put(authCtrl.authorize([PostPermissions.Interact]), postCtrl.changeReaction)
    .delete(authCtrl.authorize([PostPermissions.Interact]), postCtrl.removeReaction);

export default router;
