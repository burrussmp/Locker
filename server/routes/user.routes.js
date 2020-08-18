import express from 'express'
import userCtrl from '../controllers/user.controller';
import permission from '../permissions'
import file_upload from '../services/S3.services';

const router = express.Router()
// Path parameter middleware handlers
router.param('userId', userCtrl.userByID)
// Check permissions (path parameter is now populated so we have to re-check)
router.use('/api/users/:userId',permission.checkPermissions);

router.route('/api/users')
  .get(userCtrl.list)
  .post(userCtrl.create);

router.route('/api/users/:userId')
  .get(userCtrl.read)
  .put(userCtrl.requireAuthorization,userCtrl.update)
  .delete(userCtrl.requireAuthorization,userCtrl.remove);

router.route('/api/users/:userId/avatar')
  .get(userCtrl.getProfilePhoto)
  .post(userCtrl.requireAuthorization,userCtrl.uploadProfilePhoto)
  .delete(userCtrl.requireAuthorization,userCtrl.removeProfilePhoto);
  
router.route('/api/users/follow')
    .put(userCtrl.addFollowing, userCtrl.addFollower)

router.route('/api/users/unfollow')
    .put( userCtrl.removeFollowing, userCtrl.removeFollower)

router.route('/api/users/findpeople/:userId')
   .get(userCtrl.findPeople)

export default router
