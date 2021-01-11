/* eslint-disable new-cap */
/* eslint-disable max-len */
import express from 'express';
import collectionCtrl from '@server/controllers/collection.controller';
import authCtrl from '@server/controllers/auth.controller';
import permission from '@server/permissions';

const CollectionPermissions = permission.CollectionPermissions;

const router = express.Router();

router.param('collectionId', collectionCtrl.collectionByID);

router.route('/api/collections')
    .get(authCtrl.authorize([], false), collectionCtrl.list)
    .post(authCtrl.authorize([CollectionPermissions.Create]), collectionCtrl.create);

router.route('/api/collections/:collectionId')
    .get(authCtrl.authorize([], false), collectionCtrl.read)
    .put(authCtrl.authorize([CollectionPermissions.EditContent]), collectionCtrl.enforceSameOrganization, collectionCtrl.update)
    .delete(authCtrl.authorize([CollectionPermissions.Delete]), collectionCtrl.enforceSameOrganization, collectionCtrl.remove);

export default router;
