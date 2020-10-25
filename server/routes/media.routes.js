import express from 'express';
import mediaController from '../controllers/media.controller';
import permission from '../permissions';

const router = express.Router()

router.param('key', mediaController.mediaExists)

router.route('/api/media/:key')
  .get(permission.Authorize([]), mediaController.getMedia)

export default router
