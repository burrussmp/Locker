'use strict';

// should be valid organization
const PostData = [{
  type: 'ProductPost',
  caption: 'Check out the new product!',
  tags: ['cool', 'new', 'fancy', 'taggy'],
}, {
  type: 'ProductPost',
  caption: 'This is the other product',
  tags: ['tag', 'tag', 'tag', 'tag'],
}, {
  type: 'ProductPost',
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
