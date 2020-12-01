/* eslint-disable no-invalid-this */
/* eslint-disable max-len */
'use strict';

import mongoose from 'mongoose';
import StaticStrings from '../../config/StaticStrings';
import authCtrl from '../controllers/auth.controller';

const ReactionTypes = ['like', 'love', 'laugh', 'surprise', 'mad', 'sad'];
const ReactionSchema = new mongoose.Schema({
  type: {
    type: String,
    trim: true,
    required: true,
    enum: {
      values: ReactionTypes,
      message: StaticStrings.PostModelErrors.InvalidReaction,
    },
  },
  postedBy: {
    type: mongoose.Schema.ObjectId,
    required: true,
    ref: 'User',
  },
}, {
  timestamps: {
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
  },
});

const tagLimit = (val) => {
  return val.length <=7;
};

const PostSchema = new mongoose.Schema({
  contentType: {
    type: String,
    trim: true,
    required: StaticStrings.PostModelErrors.TypeRequired,
    enum: {
      values: ['ProductPost'],
      message: StaticStrings.PostModelErrors.IncorrectType,
    },
  },
  content: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'contentType',
    required: StaticStrings.PostModelErrors.MissingContent,
  },
  postedByType: {
    type: String,
    trim: true,
    required: StaticStrings.PostModelErrors.PostedByTypeRequired,
    enum: {
      values: authCtrl.ALLOWED_COGNITO_POOL_TYPES,
      message: `${StaticStrings.PostModelErrors.IncorrectPostedByType}\nThe following are allowed ${authCtrl.IncorrectPostedByType}`,
    },
  },
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'postedByType',
    required: StaticStrings.PostModelErrors.PostedByRequired,
  },
  caption: {
    type: String,
    trim: true,
    default: '',
    maxlength: [300, StaticStrings.PostModelErrors.MaxCaptionSizeError],
  },
  reactions: [ReactionSchema],
  comments: [{type: mongoose.Schema.ObjectId, ref: 'Comment'}],
  tags: {
    type: [{
      type: String,
      trim: true,
      lowercase: true,
      maxlength: [20, StaticStrings.PostModelErrors.MaxLengthTag],
      match: [/^$|^[a-zA-Z]+$/, StaticStrings.PostModelErrors.TagMustBeAlphabetical],
    }],
    default: [],
    validate: [tagLimit, StaticStrings.PostModelErrors.MaximumNumberOfTags],
  },
}, {
  timestamps: {
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
  },
});

// cleanup
PostSchema.pre('deleteOne', {document: true, query: false}, async function() {
  const content = await mongoose.model(this.contentType).findById(this.content); // delegate cleaning to the post
  if (content) {
    await content.deleteOne();
    for (const comment of this.comments) {
      await mongoose.model('Comment').findByIdAndRemove(comment._id);
    }
  }
});

export default mongoose.model('Post', PostSchema);
