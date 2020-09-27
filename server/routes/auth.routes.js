// imports
import express from 'express'
import authCtrl from '../controllers/auth.controller'

// create router
const router = express.Router()

// Auth API
router.route('/auth/login')
  .post(authCtrl.login);

router.route('/auth/logout')
  .get(authCtrl.logout);

router.route('/auth/verify_token')
  .head(authCtrl.verifyToken);

router.route('/auth/forgot_password')
  .post(authCtrl.forgotPassword)

router.route('/auth/confirm_forgot_password')
  .post(authCtrl.confirmForgotPassword)

export default router
