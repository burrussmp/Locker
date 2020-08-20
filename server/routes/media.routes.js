import express from 'express';
import mediaController from '../controllers/media.controller';
import permission from '../permissions';

const router = express.Router()

router.param('key', mediaController.imageByKey)

router.route('/api/image/:key')
  .get(permission.Authorize, mediaController.getImage)

export default router
