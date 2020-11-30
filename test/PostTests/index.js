'use strict';

import ProductPostBasic from './product.post.basic.test';
// import ReactionTest from './reaction.test';

const postTests = () => {
  describe('PATH: \'/api/posts\'', ProductPostBasic);
  // describe('PATH: /api/posts/:postId/reaction', ReactionTest);
};

export default postTests;
