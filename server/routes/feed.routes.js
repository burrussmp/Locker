// imports
/* eslint-disable new-cap */
/* eslint-disable max-len */
import express from 'express';
import feedCtrl from '@server/controllers/feed.controller';
import userCtrl from '@server/controllers/user.controller';
import authCtrl from '@server/controllers/auth.controller';

// create new router
const router = express.Router();

// handle path parameters
router.param('userId', userCtrl.userByID);


router.route('/api/foryou/:userId')
    .get(authCtrl.authorize([], true), authCtrl.requireOwnership, feedCtrl.getForYouFeed)

router.route('/api/follow/:userId')
    .get(authCtrl.authorize([], true), authCtrl.requireOwnership, feedCtrl.getFollowerFeed)    

export default router;
