'use strict';

// should be valid organization
const PostData = [{
  type: 'ProductPost',
  price: 34.23,
  caption: 'Check out the new product!',
  tags: 'cool,new,fancy,taggy',
}, {
  type: 'ProductPost',
  price: 66.73,
  caption: 'This is the other product',
  tags: 'tag,tag,tag,tag',
}, {
  type: 'ProductPost',
  price: 99.99,
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
