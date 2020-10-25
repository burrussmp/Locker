import mongoose from 'mongoose'
import StaticStrings from "../../config/StaticStrings";
const ProductModelErrors = StaticStrings.ProductModelErrors;

const ProductSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: 'Name is required',
      trim: true,
    },
    tags: {
      type: [String],
    },
    meta: {
      type: Object
    },
    price: {
      type: Number,
      required: ProductModelErrors.NameRequired,
      min: [0, ProductModelErrors.NegativePrice]
    },
    media: {
      type: mongoose.Schema.ObjectId,
      ref: "Media",
      required: ProductModelErrors.MediaRequired
    },
    description: {
      type: String,
      trim: true,
      required: ProductModelErrors.DescriptionRequired,
    },
    url: {
      type: String,
      trim: true,
      required: ProductModelErrors.UrlRequired,
    },
    exists: {
      type: Boolean,
      required: ProductModelErrors.ExistsRequired,
    },
    sizes: {
      type: [{ type: String }],
      default: [],
    },
    all_media: {
      type: [{ type: mongoose.Schema.ObjectId, ref: "Media" }],
      default: []
    }
  },
  {
    timestamps: {
      createdAt: "createdAt",
      updatedAt: "updatedAt",
    },
    index: true,
  }
);

/**
 * TODO
 * Upon creation, check if the url is valid and that the product exists
 * TODO
 * On a get, check if the url is still valid. If not valid, set to false
*/

ProductSchema.pre("deleteOne",{document: true,query:false },async function(){
  let media = await mongoose.models.Media.findById(this.media); // delegate cleanup to media
  await media.deleteOne();
  for (let additional_media of this.all_media){
    media = await mongoose.models.Media.findById(additional_media); // delegate cleanup to media
    await media.deleteOne();
  }
});

export default mongoose.model('Product', ProductSchema)
