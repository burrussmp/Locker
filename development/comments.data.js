'use strict';
import Comment from '@server/models/comment.model';
import {UserData} from './user.data';
import {createUser} from '../test/helper';
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
];

const Setup = async () => {
  let i = 0;
  for (const fakeUser of UserData) {
    const user = await createUser(fakeUser);
    let comment = {
      text: CommentData[i].text,
      postedBy: user._id,
    };
    comment = new Comment(comment);
    comment = await comment.save();
    i += 1;
  }
};

export {
  CommentData,
  Setup,
};
