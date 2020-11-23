'use strict';

import RepliesTest from './replies.test';
import CommentTest from './comments.test';

const commentTests = () => {
  describe('PATH: \'/api/:commentId\'', RepliesTest);
  describe('PATH: /api/posts/:postId/comments', CommentTest);
};

export default commentTests;
