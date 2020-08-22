"use strict";

// imports
import mongoose from 'mongoose';
import StaticStrings from "../../../config/StaticStrings";
import S3_Services from '../../services/S3.services';


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
  let image = await mongoose.models.Media.findById(this.media);
  S3_Services.deleteMediaS3(image.key)
    .catch((err)=>{
        console.log(err);
    })
});

export default mongoose.model('ContentPost',ContentPostSchema)
