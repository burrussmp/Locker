"use strict";

// imports
import mongoose from 'mongoose';
import StaticStrings from "../../../config/StaticStrings";

const ContentPostSchema = new mongoose.Schema({
  media: {
    type: mongoose.Schema.ObjectId, 
    required: true,
    ref: "Media"
  },
  price : {
    type : Number,
    require: StaticStrings.PostModelErrors.ContentPostErrors.PriceRequired,
    min: [0,StaticStrings.PostModelErrors.PriceNotNonnegative]
  }
});

ContentPostSchema.pre("deleteOne",{document: true,query:false },async function(){
  let media = await mongoose.models.Media.findById(this.media); // delegate cleanup to media
  await media.deleteOne();
});

export default mongoose.model('ContentPost',ContentPostSchema)

