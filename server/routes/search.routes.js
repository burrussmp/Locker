// imports
import express from 'express'
import searchCtrl from '../controllers/search.controller';
import permission from '../permissions'

// create new router
const router = express.Router()

// handle path parameters
// router.param('userId', userCtrl.userByID)

/*
  * -------------- Search API ------------------
  * For specific documentation, please see /Documentation/index.html
*/



router.route('/api/search/users')
  .post(permission.Authorize, searchCtrl.searchUsers)

export default router

