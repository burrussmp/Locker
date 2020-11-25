/* eslint-disable no-invalid-this */
/* eslint-disable max-len */
import mongoose from 'mongoose';
import StaticStrings from '../../config/StaticStrings';
import validators from '../services/validators';

const OrganizationModelErrors = StaticStrings.OrganizationModelErrors;

const OrgSchema = new mongoose.Schema(
    {
      name: {
        type: String,
        trim: true,
        required: OrganizationModelErrors.NameRequired,
        unique: true,
      },
      logo: {
        type: mongoose.Schema.ObjectId,
        ref: 'Media',
        required: OrganizationModelErrors.LogoRequired,

      },
      last_scraped: {
        type: Date,
      },
      url: {
        type: String,
        trim: true,
        required: OrganizationModelErrors.UrlRequired,
        unique: true,
      },
      description: {
        type: String,
        default: '',
      },
      products: {
        type: [
          {type: mongoose.Schema.ObjectId, ref: 'Product'},
        ],
      },
    },
    {
      timestamps: {
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
      },
      index: true,
    },
);

OrgSchema.path('name').validate(async function(value) {
  const count = await mongoose.models.Organization.countDocuments({name: value});
  const isUnique = this ? count == 0 || !this.isModified('name') : count == 0;
  if (!isUnique) {
    throw validators.createValidationError(OrganizationModelErrors.NameAlreadyExists);
  }
}, null);

OrgSchema.path('url').validate(async function(value) {
  const count = await mongoose.models.Organization.countDocuments({url: value});
  const isUnique = this ? count == 0 || !this.isModified('url') : count == 0;
  if (!isUnique) {
    throw validators.createValidationError(OrganizationModelErrors.URLAlreadyExists);
  }
}, null);

OrgSchema.pre('deleteOne', {document: true, query: false}, async function() {
  // clean up logo
  const media = await mongoose.models.Media.findById(this.logo);
  if (media) {
    await media.deleteOne();
  }
});

OrgSchema.pre('findOneAndUpdate', async function() {
  // sanitize
  const update = await this.getUpdate();
  if (!update) return; // no updates
  const doc = await this.model.findOne(this.getFilter());
  if (!doc) return; // nothing to update
  for (const key of Object.keys(update)) {
    if (update[key] == doc[key]) {
      delete update[key];
    }
  }
  this.setUpdate(update);
});

export default mongoose.model('Organization', OrgSchema);
