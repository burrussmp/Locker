import chai  from 'chai';
import chaiHttp from 'chai-http';
import {app} from '../../server/server';
import {UserData} from '../../development/user.data';
import {PostData,ReactionData} from '../../development/post.data';
import {CommentData} from '../../development/comments.data';
import User from '../../server/models/user.model';
import Media from '../../server/models/media.model';
import Comment from '../../server/models/comment.model';
import Post from '../../server/models/post.model';
import StaticStrings from '../../config/StaticStrings';
import {drop_database} from  '../helper';
import _ from 'lodash';

chai.use(chaiHttp);
chai.should();

const comments_test = () => {
    describe("Comments Test",()=>{

    })
}

export default comments_test;