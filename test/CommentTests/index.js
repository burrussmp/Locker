/* eslint-disable max-len */
/* eslint-disable import/no-named-as-default-member */
'use strict';

import CommentBasic from '@test/CommentTests/comments.basic.test';
import CommentSpecific from '@test/CommentTests/comments.specific.test';
import RepliesBasic from '@test/CommentTests/replies.basic.test';
import RepliesSpecific from '@test/CommentTests/replies.specific.test';

const commentTests = () => {
  describe('PATH: /api/:postId/comments', CommentBasic);
  describe('PATH: /api/comments/:commentId', CommentSpecific);
  describe('PATH: \'/api/comments/:commentId/replies\'', RepliesBasic);
  describe('PATH: \'/api/comments/:commentId/replies/:replyId\'', RepliesSpecific);
};

export default commentTests;
