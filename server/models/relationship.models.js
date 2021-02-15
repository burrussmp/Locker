/**
 * @desc Sub-document schemas for following/follower relationships.
 */
import mongoose from 'mongoose';


const FollowingSchema = new mongoose.Schema(
    {
        _id: false,
        actor: {
            type: mongoose.Schema.ObjectId,
            require: true,
            refPath: 'following.type',
        },
        type: {
            type: String,
            required: true,
            enum: {
                values: ['User', 'Organization'],
                message: "Server Error: Can only follow an 'Organization''User'."
            },
        }
    }
);
const FollowerSchema = new mongoose.Schema(
    {
        _id: false,
        actor: {
            type: mongoose.Schema.ObjectId,
            require: true,
            refPath: 'followers.type',
        },
        type: {
            type: String,
            required: true,
            enum: {
                values: ['User', 'Organization'],
                message: "Server Error: Can only be followed by 'User' or an 'Organization'."
            },
        }
    }
);

export default {
    Follower: FollowerSchema,
    Following: FollowingSchema,
}