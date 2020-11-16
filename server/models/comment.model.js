/* eslint-disable no-invalid-this */
import mongoose from 'mongoose';
import StaticStrings from '../../config/StaticStrings';
import Post from '../models/post.model';

const ReplySchema = new mongoose.Schema({
  text: {
    type: String,
    trim: true,
    required: StaticStrings.CommentModelErrors.ReplyTextRequired,
    maxlength: [300, StaticStrings.CommentModelErrors.MaxCommentSizeError],
  },
  postedBy: {
    type: mongoose.Schema.ObjectId,
    required: true,
    ref: 'User',
  },
  likes: [{
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  }],
}, {
  timestamps: {
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
  },
});

const CommentSchema = new mongoose.Schema({
  text: {
    type: String,
    trim: true,
    required: StaticStrings.CommentModelErrors.CommentTextRequired,
    maxlength: [300, StaticStrings.CommentModelErrors.MaxCommentSizeError],
  },
  postId: {
    type: mongoose.Schema.ObjectId,
    required: true,
    ref: 'Post',
  },
  postedBy: {
    type: mongoose.Schema.ObjectId,
    required: true,
    ref: 'User',
  },
  likes: [{
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  }],
  replies: [ReplySchema],
}, {
  timestamps: {
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
  },
});

// cleanup if post deleted
// eslint-disable-next-line max-len
CommentSchema.pre('deleteOne', {document: true, query: false}, async function() {
  await Post.findOneAndUpdate(
      {'_id': this.postId},
      {$pull: {comments: this._id}},
      {runValidators: true});
});

export default mongoose.model('Comment', CommentSchema);
