/* eslint-disable import/no-named-as-default-member */
'use strict';

// import RepliesTest from './replies.test';
import CommentBasic from '@test/CommentTests/comments.basic.test';
import CommentSpecific from '@test/CommentTests/comments.specific.test';

const commentTests = () => {
  // describe('PATH: \'/api/:commentId\'', RepliesTest);
  // describe('PATH: /api/:postId/comments', CommentBasic);
  describe('PATH: /api/comments/:commentId', CommentSpecific);
};

export default commentTests;
