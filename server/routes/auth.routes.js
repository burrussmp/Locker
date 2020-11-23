/* eslint-disable new-cap */
// imports
import express from 'express';
import authCtrl from '../controllers/auth.controller';
import permissions from '../permissions';

// create router
const router = express.Router();

const NoPermissions = permissions.Authorize([], false);

/**
 * User API
 */
router.route('/auth/login')
    .post(NoPermissions,
        authCtrl.login);

router.route('/auth/logout')
    .get(NoPermissions,
        authCtrl.logout);

router.route('/auth/verify_token')
    .head(NoPermissions,
        authCtrl.verifyToken);

router.route('/auth/forgot_password')
    .post(NoPermissions,
        authCtrl.forgotPassword);

router.route('/auth/confirm_forgot_password')
    .post(NoPermissions,
        authCtrl.confirmForgotPassword);

/**
 * Enterprise API
 */
router.route('/auth/ent/login')
    .post(NoPermissions,
        authCtrl.login);

router.route('/auth/ent/logout')
    .get(NoPermissions,
        authCtrl.logout);

router.route('/auth/ent/verify_token')
    .head(NoPermissions,
        authCtrl.verifyToken);

router.route('/auth/ent/forgot_password')
    .post(NoPermissions,
        authCtrl.forgotPassword);

router.route('/auth/ent/confirm_forgot_password')
    .post(NoPermissions,
        authCtrl.confirmForgotPassword);

export default router;
