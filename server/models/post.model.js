"use strict";

import mongoose from 'mongoose'
import StaticStrings from '../../config/StaticStrings';

const ReactionSchema = new mongoose.Schema({
  type: {
    type : String,
    trim: true,
    default: 'none',
    enum: {
      values: ['none','like','love','laugh','surprise','mad','sad'],
      message: StaticStrings.PostModelErrors.BadReactionType
    },
  },
  postedBy: {
    type: mongoose.Schema.ObjectId,
    required: true,
    ref: 'User',
  },
},{
  timestamps : {
    createdAt:'createdAt',
    updatedAt: 'updatedAt'
  }
});

const tagLimit = (val) => {return val.length <=7 };

const PostSchema = new mongoose.Schema({
  type : {
    type: String,
    trim: true,
    required: StaticStrings.PostModelErrors.TypeRequired,
    enum : {
      values:['ContentPost'],
      message: StaticStrings.PostModelErrors.IncorrectType
    }
  },
  content :{ 
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'type',
    required: StaticStrings.PostModelErrors.MissingContent,
  },
  postedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: StaticStrings.PostModelErrors.MissingPoster
  },
  description: {
    type: String,
    trim: true,
    default : "",
    maxlength: [300,StaticStrings.PostModelErrors.MaxDescriptionSizeError]
  },
  reactions: [ReactionSchema],
  comments: [{ type: mongoose.Schema.ObjectId, ref: 'Comment'}],
  tags: {
    type: [{
      type : String,
      trim: true,
      lowercase: true,
      maxlength: [20,StaticStrings.PostModelErrors.MaxLengthTag],
      match: [/^[a-zA-Z]+$/ , StaticStrings.PostModelErrors.TagMustBeAlphabetical]
  }],
  validate: [tagLimit,StaticStrings.PostModelErrors.MaximumNumberOfTags]
},
},{
  timestamps : {
    createdAt:'createdAt',
    updatedAt: 'updatedAt'
  }
})
// delegate cleaning up to the post
PostSchema.pre("deleteOne",{document: true,query:false },async function(){
  let content = await mongoose.model(this.type).findById(this.content);
  await content.deleteOne();
});

export default mongoose.model('Post', PostSchema)
