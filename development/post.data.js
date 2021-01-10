'use strict';

// should be valid organization
const PostData = [{
  type: 'Product',
  caption: 'Check out the new product!',
  tags: ['cool', 'new', 'fancy', 'taggy'],
}, {
  type: 'Product',
  caption: 'This is the other product',
  tags: ['tag', 'tag', 'tag', 'tag'],
}, {
  type: 'Product',
  caption: 'The third and final product',
  tags: [],
}];

const ReactionData = [['like', 'like', 'mad', 'mad', 'sad', 'laugh'],
  ['laugh', 'mad', 'sad'],
  ['like', 'love', 'laugh', 'surprise', 'mad', 'sad']];

export {
  PostData,
  ReactionData,
};
