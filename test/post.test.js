"use strict";

import RepliesTest from './CommentTests/replies.test';
import ContentPostTestBasics from './PostTests/contentpost.basic.test'
import CommentTest from './CommentTests/comments.test';
const user_tests = () => {
    //describe("PATH: '/api/:commentId'", RepliesTest);
    //describe("PATH: '/api/posts'", ContentPostTestBasics);
    describe("PATH: /api/posts/:postId/comments",CommentTest)

}

export default user_tests;