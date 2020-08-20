// imports
import express from 'express'
import userCtrl from '../controllers/user.controller';
import authCtrl from '../controllers/auth.controller';
import permission from '../permissions'

// create new router
const router = express.Router()

// handle path parameters
router.param('userId', userCtrl.userByID)

/*
  * -------------- User API ------------------
  * For specific documentation, please see /Documentation/index.html
*/

router.route('/api/users')
  .get(permission.Authorize,userCtrl.list)
  .post(permission.Authorize,userCtrl.create);

router.route('/api/users/:userId')
  .get(permission.Authorize,userCtrl.read)
  .put(permission.Authorize,authCtrl.requireOwnership,userCtrl.update)
  .delete(permission.Authorize,authCtrl.requireOwnership,userCtrl.remove);

router.route('/api/users/:userId/avatar')
  .get(permission.Authorize,userCtrl.getProfilePhoto)
  .post(permission.Authorize,authCtrl.requireOwnership,userCtrl.uploadProfilePhoto)
  .delete(permission.Authorize,authCtrl.requireOwnership,userCtrl.removeProfilePhoto);

router.route('/api/users/:userId/password')
  .put(permission.Authorize,authCtrl.requireOwnership,userCtrl.changePassword);

router.route('/api/users/:userId/follow')
    .get(permission.Authorize,userCtrl.listFollow)
    .put(permission.Authorize,userCtrl.Follow)
    .delete(permission.Authorize,userCtrl.Unfollow)

export default router
