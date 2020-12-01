/* eslint-disable new-cap */
/* eslint-disable max-len */
// imports
import express from 'express';
import searchCtrl from '@server/controllers/search.controller';
import authCtrl from '@server/controllers/auth.controller';
import permission from '@server/permissions';

const UserPermissions = permission.UserPermissions;
// create new router
const router = express.Router();

// handle path parameters
// router.param('userId', userCtrl.userByID)

/*
  * -------------- Search API ------------------
  * For specific documentation, please see /Documentation/index.html
*/


router.route('/api/search/users')
    .post(authCtrl.authorize([UserPermissions.Read]), searchCtrl.searchUsers);

export default router;

