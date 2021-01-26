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
router.param('lockerCollectionId', lockerCollectionCtrl.lockerCollectionById);
router.param('lockerProductId', lockerCtrl.lockerProductById);

router.route('/api/lockers/:lockerId/collections')
    .get(authCtrl.authorize([LockerCollectionPermissions.Read]), lockerCollectionCtrl.list) // get all locker collections
    .post(authCtrl.authorize([LockerCollectionPermissions.Create]), authCtrl.requireOwnership, lockerCollectionCtrl.create); // create collection and add to locker

router.route('/api/lockers/:lockerId/collections/:lockerCollectionId')
    .get(authCtrl.authorize([LockerCollectionPermissions.Read]), lockerCollectionCtrl.read)
    .put(authCtrl.authorize([LockerCollectionPermissions.EditContent]), authCtrl.requireOwnership, lockerCollectionCtrl.update)
    .delete(authCtrl.authorize([LockerCollectionPermissions.Delete]), authCtrl.requireOwnership, lockerCollectionCtrl.remove);


router.route('/api/lockers/:lockerId/collections/:lockerCollectionId/products')
    .get(authCtrl.authorize([LockerCollectionPermissions.Read]), lockerCollectionCtrl.getProducts) 
    .post(authCtrl.authorize([LockerCollectionPermissions.EditContent]), authCtrl.requireOwnership, lockerCollectionCtrl.addProduct) // Add product to collection and locker (if not already there)

router.route('/api/lockers/:lockerId/collections/:lockerCollectionId/products/:lockerProductId')
    .delete(authCtrl.authorize([LockerCollectionPermissions.EditContent]), authCtrl.requireOwnership, lockerCollectionCtrl.removeProduct); // remove product from locker

router.route('/api/lockers/:lockerId/collections/:lockerCollectionId/clone')
    .post(authCtrl.authorize([LockerCollectionPermissions.Read]), lockerCollectionCtrl.clone) // Clone someone's collection

router.route('/api/lockers/:lockerId/collections/:lockerCollectionId/reference')
    .post(authCtrl.authorize([LockerCollectionPermissions.Read]), lockerCollectionCtrl.reference) // Reference someone's collection

export default router;
