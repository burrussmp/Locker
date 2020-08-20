import mongoose from 'mongoose'
import StaticStrings from '../../config/StaticStrings';
import {isAlphabetical} from '../services/validators';

const ContentPostSchema = new mongoose.Schema({
  media: {type: mongoose.Schema.ObjectId, ref: 'Image'}
});

const Reaction = new mongoose.Schema({
  type: {
    type : String,
    trim: true,
    enum: {
      values: ['like','love','laugh','surprise','mad','sad'],
      message: StaticStrings.PostModelErrors.BadReactionType
    },
  },
  postedBy: {type: mongoose.Schema.ObjectId, ref: 'User'},
},{
  timestamps : {
    createdAt:'createdAt',
    updatedAt: 'updatedAt'
  }
});

const PostSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: {
      values: ['content','style'],
      message: StaticStrings.PostModelErrors.IncorrectType
    }
  },
  content :{ 
    type: mongoose.Schema.Types.ObjectId,
    required: StaticStrings.PostModelErrors.MissingContent,
    refPath: 'content'
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
    maxlength: [180,StaticStrings.PostModelErrors.MaxDescriptionSizeError]
  },
  reactions: [Reaction],
  comments: [{ type: mongoose.Schema.ObjectId, ref: 'Comment'}],
  tags: [{
    type : String,
    trim: true,
    lowercase: true,
    maxlength: [20,StaticStrings.PostModelErrors.MaxLengthTag],
    match: [/^[a-zA-Z]+$/ , StaticStrings.PostModelErrors.TagMustBeAlphabetical]
  }],
},{
  timestamps : {
    createdAt:'createdAt',
    updatedAt: 'updatedAt'
  }
})

export default mongoose.model('Post', PostSchema)
