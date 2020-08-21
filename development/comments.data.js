"use strict";
import User from '../server/models/user.model';
import Comment from '../server/models/comment.model';
import {UserData} from './user.data';
// comments
const CommentData = [{
        text: 'This is a comment',
    },
    {
        text: 'This is another @someperson comment',
    },
    {
        text: 'What the heck @someperson comments',
    },
    {
        text: 'New comment 1',
    },
    {
        text: 'New comment 2',
    },
]

const Setup = async () => {
    let i = 0;
    for (let fake_user of UserData) {
        let user = new User(fake_user);
        user = await user.save()
        let comment = {
            text: CommentData[i].text,
            postedBy: user._id
        }
        comment = new Comment(comment);
        comment = await comment.save();
        i += 1;
    }
}

export {
    CommentData,
    Setup
};