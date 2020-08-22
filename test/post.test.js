"use strict";

import RepliesTest from './CommentTests/replies.test';
import PostTestBasics from './PostTests/basic.posts.test'
const user_tests = () => {
    // describe("PATH: '/api/:commentId'", RepliesTest);
    describe("PATH: '/api/posts'", PostTestBasics);

}

export default user_tests;