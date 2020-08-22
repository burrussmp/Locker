"use strict";

import mongoose from 'mongoose'
import StaticStrings from '../../config/StaticStrings';

const ReactionSchema = new mongoose.Schema({
  type: {
    type : String,
    trim: true,
    required: true,
    enum: {
      values: ['like','love','laugh','surprise','mad','sad'],
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
  caption: {
    type: String,
    trim: true,
    default : "",
    maxlength: [300,StaticStrings.PostModelErrors.MaxCaptionSizeError]
  },
  reactions: [ReactionSchema],
  comments: [{ type: mongoose.Schema.ObjectId, ref: 'Comment'}],
  tags: {
    type: [{
      type : String,
      trim: true,
      lowercase: true,
      maxlength: [20,StaticStrings.PostModelErrors.MaxLengthTag],
      match: [/^$|^[a-zA-Z]+$/ , StaticStrings.PostModelErrors.TagMustBeAlphabetical]
  }],
  default: [],
  validate: [tagLimit,StaticStrings.PostModelErrors.MaximumNumberOfTags]
},
},{
  timestamps : {
    createdAt:'createdAt',
    updatedAt: 'updatedAt'
  }
})

// cleanup
PostSchema.pre("deleteOne",{document: true,query:false },async function(){
  let content = await mongoose.model(this.type).findById(this.content); // delegate cleaning to the post
  await content.deleteOne();
  for (let comment of this.comments){
    await mongoose.models.comments.findByIdAndRemove(comment);
  }
});

export default mongoose.model('Post', PostSchema)
