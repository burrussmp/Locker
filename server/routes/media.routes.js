/* eslint-disable new-cap */
/* eslint-disable max-len */
import express from 'express';
import mediaController from '../controllers/media.controller';
import authCtrl from '../controllers/auth.controller';

const router = express.Router();

router.param('key', mediaController.mediaExists);

router.route('/api/media/:key')
    .get(authCtrl.authorize([]), mediaController.getMedia);

export default router;
