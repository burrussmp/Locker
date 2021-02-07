/* eslint-disable new-cap */
/* eslint-disable max-len */
// imports
import express from 'express';
import searchCtrl from '@server/controllers/search.controller';
import authCtrl from '@server/controllers/auth.controller';
import permission from '@server/permissions';

// create new router
const router = express.Router();

router.route('/api/search/users')
    .post(authCtrl.authorize([permission.UserPermissions.Read]), searchCtrl.searchUsers);

router.route('/api/search/organizations')
    .post(authCtrl.authorize([permission.OrganizationPermissions.Read]), searchCtrl.searchOrganizations);
  
export default router;

