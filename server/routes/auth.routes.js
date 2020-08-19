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

export default router
