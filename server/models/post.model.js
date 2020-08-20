import mongoose from 'mongoose'
import StaticStrings from '../../config/StaticStrings';

const ContentPostSchema = new mongoose.Schema({
  type : {
    type: String,
    default: "ContentPost"
  },
  media: {
    type: mongoose.Schema.ObjectId, 
    required: true,
    ref: 'Image'
  }
});

const ReactionSchema = new mongoose.Schema({
  type: {
    type : String,
    required: true,
    trim: true,
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

const PostSchema = new mongoose.Schema({
  content :{ 
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'content',
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
    maxlength: [180,StaticStrings.PostModelErrors.MaxDescriptionSizeError]
  },
  reactions: [ReactionSchema],
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

mongoose.model('ContentPost',ContentPostSchema)
export default mongoose.model('Post', PostSchema)
