/* eslint-disable new-cap */
/* eslint-disable max-len */
import express from 'express';
import authCtrl from '@server/controllers/auth.controller';
import lockerCtrl from '@server/controllers/locker/locker.controller';
import lockerCollectionCtrl from '@server/controllers/locker/locker.collection.controller';
import permission from '@server/permissions';

const LockerCollectionPermissions = permission.LockerCollectionPermissions;

const router = express.Router();

router.param('lockerId', lockerCtrl.lockerById);
router.param('lockerCollectionId', lockerCollectionCtrl.lockerById);

router.route('/api/lockers/:lockerId/collections')
    .get(authCtrl.authorize([], false), lockerCollectionCtrl.list) // get all locker collections
    .post(authCtrl.authorize([LockerCollectionPermissions.Create]), lockerCollectionCtrl.create); // create collection and add to locker

router.route('/api/lockers/:lockerId/collections/:lockerCollectionId')
    .get(authCtrl.authorize([], false), lockerCtrl.read)
    .put(authCtrl.authorize([LockerCollectionPermissions.EditContent]), authCtrl.requireOwnership, lockerCollectionCtrl.update)
    .delete(authCtrl.authorize([LockerCollectionPermissions.Delete]), authCtrl.requireOwnership, lockerCollectionCtrl.remove);

router.route('/api/lockers/:lockerId/collections/:lockerCollectionId/products')
    .get(authCtrl.authorize([LockerCollectionPermissions.Read]), lockerCollectionCtrl.getProducts) // Add product to collection and locker
    .put(authCtrl.authorize([LockerCollectionPermissions.EditContent]), authCtrl.requireOwnership, lockerCollectionCtrl.addProduct) // add product to locker
    .delete(authCtrl.authorize([LockerCollectionPermissions.EditContent]), authCtrl.requireOwnership, lockerCollectionCtrl.removeProduct) // remove product from locker

export default router;
