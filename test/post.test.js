"use strict";

import RepliesTest from './CommentTests/replies.test';
import ContentPostTestBasics from './PostTests/contentpost.basic.test'
import CommentTest from './CommentTests/comments.test';
import ReactionTest from './PostTests/reaction.test';
const user_tests = () => {
    // describe("PATH: '/api/:commentId'", RepliesTest);
    // describe("PATH: '/api/posts'", ContentPostTestBasics);
    describe("PATH: /api/posts/:postId/comments", CommentTest)
    describe("PATH: /api/posts/:postId/reaction", ReactionTest)
}

export default user_tests;