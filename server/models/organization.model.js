/* eslint-disable camelcase */
/* eslint-disable no-invalid-this */
/* eslint-disable max-len */
import mongoose from 'mongoose';
import mongoose_fuzzy_searching from 'mongoose-fuzzy-searching';

import RelationshipModels from '@server/models/relationship.models';

import Media from '@server/models/media.model';
import StreamClient from '@server/services/stream/client';
import Validator from '@server/services/validator';
import StaticStrings from '@config/StaticStrings';


const { OrganizationModelErrors } = StaticStrings;

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
    following: [RelationshipModels.Following],
    followers: [RelationshipModels.Follower],
  },
  {
    timestamps: {
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
    },
    index: true,
  },
);

OrgSchema.path('name').validate(async function (value) {
  const count = await mongoose.models.Organization.countDocuments({ name: value });
  const isUnique = this ? count === 0 || !this.isModified('name') : count === 0;
  if (!isUnique) {
    throw Validator.createValidationError(OrganizationModelErrors.NameAlreadyExists);
  }
}, null);

OrgSchema.path('url').validate(async function (value) {
  const count = await mongoose.models.Organization.countDocuments({ url: value });
  const isUnique = this ? count === 0 || !this.isModified('url') : count === 0;
  if (!isUnique) {
    throw Validator.createValidationError(OrganizationModelErrors.URLAlreadyExists);
  }
}, null);

OrgSchema.pre('deleteOne', { document: true, query: false }, async function () {
  // clean up logo
  if (this.logo) {
    const media = await Media.findById(this.logo);
    if (media) {
      await media.deleteOne();
    }
  }

  // clean up following: Update their followers
  for (const following of this.following) {
    await StreamClient.feed.unfollow[following.type](this._id.toString(), following.actor.toString());
    // remove from list of who they follow
    await mongoose.models[following.type].findOneAndUpdate(
        {_id: following.actor},
        {$pull: {followers: {actor: this._id}}},
    );
  }

  // clean up followers: Update their following
  for (const follower of this.followers) {
    await StreamClient.feed.unfollow.Organization(follower.actor.toString(), this._id.toString());
    // remove from list of who they follow
    await mongoose.models[follower.type].findOneAndUpdate(
        {_id: follower.actor},
        {$pull: {following: {actor: this._id}}},
    );
  }

  // clean the organization in stream
  await StreamClient.clean.Organization(this._id);
});


OrgSchema.plugin(mongoose_fuzzy_searching, {
  fields: [
    {
      name: 'name',
      minSize: 2,
      weight: 10,
    },
  ],
});

export default mongoose.model('Organization', OrgSchema);
