import mongoose from 'mongoose'
import StaticStrings from "../../config/StaticStrings";
const OrganizationModelErrors = StaticStrings.OrganizationModelErrors;

const OrgSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: OrganizationModelErrors.NameRequired,
    },
    logo: {
      type: mongoose.Schema.ObjectId,
      ref: "Media",
      required: OrganizationModelErrors.LogoRequired

    },
    url: {
      type: String,
      trim: true,
      required: OrganizationModelErrors.UrlRequired,
    },
    employees: [{ type: mongoose.Schema.ObjectId, ref: "Employee" }],
    description: {
      type: String,
      default: ''
    },
    products: {
      type: [
        { type: mongoose.Schema.ObjectId, ref: "Product" }
      ]
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

OrgSchema.pre("deleteOne", { document: true, query: false }, async function () {
  // clean up profile photo
  let media = await mongoose.models.Media.findById(this.logo);
  if (media) {
    await media.deleteOne();
  }
});

/**
 * TODO
 * Handle delete (?). Probably should delete all products
 */

export default mongoose.model('Organization', OrgSchema)