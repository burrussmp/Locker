import mongoose from 'mongoose'
import StaticStrings from '../../config/StaticStrings'

const ReplySchema = new mongoose.Schema({
    text: {
        type: String,
        trim: true,
        required: StaticStrings.CommentModelErrors.ReplyTextRequired,
        maxlength: [300, StaticStrings.CommentModelErrors.MaxCommentSizeError]
    },
    postedBy: {
        type: mongoose.Schema.ObjectId,
        required: true,
        ref: 'User'
    },
    likes: [{
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    }],
}, {
    timestamps: {
        createdAt: 'createdAt',
        updatedAt: 'updatedAt'
    }
});

const CommentSchema = new mongoose.Schema({
    text: {
        type: String,
        trim: true,
        required: StaticStrings.CommentModelErrors.CommentTextRequired,
        maxlength: [300, StaticStrings.CommentModelErrors.MaxCommentSizeError]
    },
    postedBy: {
        type: mongoose.Schema.ObjectId,
        required: true,
        ref: 'User'
    },
    likes: [{
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    }],
    replies: [ReplySchema],
}, {
    timestamps: {
        createdAt: 'createdAt',
        updatedAt: 'updatedAt'
    }
})

export default mongoose.model('Comment', CommentSchema);