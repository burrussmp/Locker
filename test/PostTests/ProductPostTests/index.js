'use strict';

import Basic from './product.post.basic.test';
import Specific from './product.post.specific.test';


const productPostTests = () => {
  describe('PRODUCT POSTS: \'/api/posts\'', Basic);
  describe('PATH: \'/api/posts/:postId\'', Specific);
};

export default productPostTests;
