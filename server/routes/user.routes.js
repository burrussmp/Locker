// imports
/* eslint-disable new-cap */
/* eslint-disable max-len */
import express from 'express';
import userCtrl from '../controllers/user.controller';
import authCtrl from '../controllers/auth.controller';
import permission from '../permissions';

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
    .get(permission.Authorize([], false), userCtrl.list)
    .post(permission.Authorize([], false), userCtrl.create);

router.route('/api/users/:userId')
    .get(permission.Authorize([UserPermissions.Read]), userCtrl.read)
    .put(permission.Authorize([UserPermissions.EditContent]), authCtrl.requireOwnership, userCtrl.update)
    .delete(permission.Authorize([UserPermissions.Delete]), authCtrl.requireOwnership, userCtrl.remove);

router.route('/api/users/:userId/avatar')
    .get(permission.Authorize([UserPermissions.Read]), userCtrl.getProfilePhoto)
    .post(permission.Authorize([UserPermissions.EditContent]), authCtrl.requireOwnership, userCtrl.uploadProfilePhoto)
    .delete(permission.Authorize([UserPermissions.Delete]), authCtrl.requireOwnership, userCtrl.removeProfilePhoto);

router.route('/api/users/:userId/password')
    .put(permission.Authorize([UserPermissions.ChangePassword]), authCtrl.requireOwnership, userCtrl.changePassword);

router.route('/api/users/:userId/follow')
    .get(permission.Authorize([UserPermissions.Read]), userCtrl.listFollow)
    .put(permission.Authorize([UserPermissions.EditContent]), userCtrl.Follow)
    .delete(permission.Authorize([UserPermissions.EditContent]), userCtrl.Unfollow);

export default router;
