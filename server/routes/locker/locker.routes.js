/* eslint-disable new-cap */
/* eslint-disable max-len */
import express from 'express';
import authCtrl from '@server/controllers/auth.controller';
import lockerCtrl from '@server/controllers/locker/locker.controller';
import permission from '@server/permissions';

const LockerPermissions = permission.LockerPermissions;

const router = express.Router();

router.param('lockerId', lockerCtrl.lockerById);
router.param('lockerProductId', lockerCtrl.lockerProductById);

router.route('/api/lockers')
    .get(authCtrl.authorize([], false), lockerCtrl.list)
    .post(authCtrl.authorize([LockerPermissions.Create]), lockerCtrl.create);

router.route('/api/lockers/:lockerId')
    .get(authCtrl.authorize([], false), lockerCtrl.read)
    .put(authCtrl.authorize([LockerPermissions.EditContent]), authCtrl.requireOwnership, lockerCtrl.update)
    .delete(authCtrl.authorize([LockerPermissions.Delete]), authCtrl.requireOwnership, lockerCtrl.remove);

router.route('/api/lockers/:lockerId/products')
    .get(authCtrl.authorize([LockerPermissions.Read]), lockerCtrl.getProducts) // get all products from locker
    .post(authCtrl.authorize([LockerPermissions.EditContent]), authCtrl.requireOwnership, lockerCtrl.addProduct) // add product to locker

router.route('/api/lockers/:lockerId/products/:lockerProductId')
    .delete(authCtrl.authorize([LockerPermissions.EditContent]), authCtrl.requireOwnership, lockerCtrl.removeProduct) // remove product from locker

export default router;
