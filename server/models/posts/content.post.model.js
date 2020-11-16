/* eslint-disable max-len */
'use strict';

// imports
import mongoose from 'mongoose';
import StaticStrings from '../../../config/StaticStrings';

const ContentPostErrors = StaticStrings.PostModelErrors.ContentPostErrors;

const ContentPostSchema = new mongoose.Schema({
  // media: {
  //   type: mongoose.Schema.ObjectId,
  //   required: true,
  //   ref: "Media"
  // },
  // price : {
  //   type : Number,
  //   required: StaticStrings.PostModelErrors.ContentPostErrors.PriceRequired,
  //   min: [0,StaticStrings.PostModelErrors.PriceNotNonnegative]
  // }
  product: {
    type: mongoose.Schema.ObjectId,
    required: ContentPostErrors.ProductRequired,
    ref: 'Product',
  },
});

// ContentPostSchema.pre("deleteOne",{document: true,query:false },async function(){
//   let product = await mongoose.models.Product.findById(this.Product); // delegate cleanup to media
//   await media.deleteOne();
// });

export default mongoose.model('ContentPost', ContentPostSchema);

