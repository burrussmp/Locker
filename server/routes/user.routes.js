// imports
/* eslint-disable new-cap */
/* eslint-disable max-len */
import express from 'express';
import userCtrl from '@server/controllers/user.controller';
import authCtrl from '@server/controllers/auth.controller';
import relationshipCtrl from '@server/controllers/relationship.controller';

import permission from '@server/permissions';

const UserPermissions = permission.UserPermissions;

// create new router
const router = express.Router();

// handle path parameters
router.param('userId', userCtrl.userByID);

/*
  * -------------- User API ------------------
  * For specific documentation, please see /Documentation/index.html
*/

router.route('/api/users')
    .get(authCtrl.authorize([], false), userCtrl.list)
    .post(authCtrl.authorize([], false), userCtrl.create);

router.route('/api/users/:userId')
    .get(authCtrl.authorize([UserPermissions.Read]), userCtrl.read)
    .put(authCtrl.authorize([UserPermissions.EditContent]), authCtrl.requireOwnership, userCtrl.update)
    .delete(authCtrl.authorize([UserPermissions.Delete]), authCtrl.requireOwnership, userCtrl.remove);

router.route('/api/users/:userId/avatar')
    .get(authCtrl.authorize([UserPermissions.Read]), userCtrl.getProfilePhoto)
    .post(authCtrl.authorize([UserPermissions.EditContent]), authCtrl.requireOwnership, userCtrl.uploadProfilePhoto)
    .delete(authCtrl.authorize([UserPermissions.Delete]), authCtrl.requireOwnership, userCtrl.removeProfilePhoto);

router.route('/api/users/:userId/password')
    .put(authCtrl.authorize([UserPermissions.ChangePassword]), authCtrl.requireOwnership, userCtrl.changePassword);

router.route('/api/users/:userId/follow')
    .get(authCtrl.authorize([UserPermissions.Follow]), relationshipCtrl.listFollow('User'))
    .put(authCtrl.authorize([UserPermissions.Follow]), relationshipCtrl.follow('User'))
    .delete(authCtrl.authorize([UserPermissions.Follow]), relationshipCtrl.unfollow('User'));

export default router;
