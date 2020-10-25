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
    access_list: {
      type: [{
        user: {
          type: mongoose.Schema.ObjectId,
          ref: 'user',
          required: true,
        },
        permissions: [{type: String}]
      }],
    },
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

/**
 * TODO
 * Handle delete (?). Probably should delete all products
 */

export default mongoose.model('Organization', OrgSchema)