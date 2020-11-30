/* eslint-disable new-cap */
/* eslint-disable max-len */
import express from 'express';
import productCtrl from '../controllers/product.controller';
import authCtrl from '../controllers/auth.controller';
import permission from '../permissions';

const ProductPermissions = permission.ProductPermissions;

const router = express.Router();

router.param('productId', productCtrl.productById);

router.route('/api/products')
    .get(authCtrl.authorize([], false), productCtrl.list)
    .post(authCtrl.authorize([ProductPermissions.Create]), productCtrl.create);

router.route('/api/products/:productId')
    .get(authCtrl.authorize([], false), productCtrl.read)
    .put(authCtrl.authorize([ProductPermissions.EditContent]), productCtrl.enforceSameOrganization, productCtrl.update)
    .delete(authCtrl.authorize([ProductPermissions.Delete]), productCtrl.enforceSameOrganization, productCtrl.remove);

export default router;
