// imports
import express from 'express'
import userCtrl from '../controllers/user.controller';
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
  .put(permission.Authorize,userCtrl.requireOwnership,userCtrl.update)
  .delete(permission.Authorize,userCtrl.requireOwnership,userCtrl.remove);

router.route('/api/users/:userId/avatar')
  .get(permission.Authorize,userCtrl.getProfilePhoto)
  .post(permission.Authorize,userCtrl.requireOwnership,userCtrl.uploadProfilePhoto)
  .delete(permission.Authorize,userCtrl.requireOwnership,userCtrl.removeProfilePhoto);

router.route('/api/users/:userId/password')
  .put(permission.Authorize,userCtrl.requireOwnership,userCtrl.changePassword);

router.route('/api/users/follow')
    .put(permission.Authorize,userCtrl.addFollowing, userCtrl.addFollower)

router.route('/api/users/unfollow')
    .put(permission.Authorize,userCtrl.removeFollowing, userCtrl.removeFollower)

router.route('/api/users/findpeople/:userId')
   .get(permission.Authorize,userCtrl.findPeople)

export default router
