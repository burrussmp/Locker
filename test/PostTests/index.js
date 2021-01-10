'use strict';

import ProductPostTests from './ProductPostTests/index';
import ReactionTest from './post.reaction.test';

const postTests = () => {
  describe('PATH: \'/api/posts\'', ProductPostTests);
  describe('PATH: /api/posts/:postId/reaction', ReactionTest);
};

export default postTests;
