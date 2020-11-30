'use strict';

import ContentPostTestBasics from './contentpost.basic.test';
// import ReactionTest from './reaction.test';

const postTests = () => {
  describe('PATH: \'/api/posts\'', ContentPostTestBasics);
  // describe('PATH: /api/posts/:postId/reaction', ReactionTest);
};

export default postTests;
