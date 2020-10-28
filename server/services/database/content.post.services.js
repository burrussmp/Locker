"use strict";

// imports
import S3_Services from '../S3.services';
import ContentPost from '../../models/posts/content.post.model';
import Post from '../../models/post.model';
import errorHandler from '../dbErrorHandler'
import StaticStrings from '../../../config/StaticStrings';
/**
 * @desc Fetches all the content posts
 * @param String replyId - REtrieve a specific post if necessary
 * @return A promise of a list of posts (by ID)
 */
const fetchPosts = async (postId=undefined) => {
    if(postId){
        return Post.findById(postId);
    } else {
        return Post.find().select('_id createdAt')
    }
};


/**
  * @desc Creates a new content post. 
  * Creates a media and post.price is set
  * @param Object req - HTTP request object
  * @param Object res - HTTP response object
  * @param Object   post   - Contains info to construct content post
*/ 
const createContentPost = async (req,res) => {
    let type = "ContentPost";
    let media_meta = {
        'type' : type,
        'uploadedBy' : req.auth._id,
        'uploadedByType': 'employee'
    };
    S3_Services.uploadSingleMediaS3(req,res,media_meta, async (req,res,image)=>{
        let contentPost;
        try {
            contentPost = new ContentPost({
                price: req.body.price,
                media: image._id
            })
            contentPost = await contentPost.save();
        } catch(err) {
            return S3_Services.deleteMediaS3(req.file.key).then(()=>{
                return res.status(400).json({error:errorHandler.getErrorMessage(err)});
            }).catch((err2)=>{
                return res.status(500).json({error:"Posting Server Error: Unable to create content for post and failed to clean s3 "
                + ' because ' + err.message + ' and '+ err2.message});
            })
        }
        try {
            let postData = {
                type: type,
                content: contentPost._id,
                postedBy : req.auth._id,
                caption : 'caption' in req.body ? req.body.caption : "",
                tags: 'tags' in req.body ?  req.body.tags.split(',').filter(s=>Boolean(s.trim())) : []
            };
            let newPost = new Post(postData);
            newPost = await newPost.save();
            return res.status(200).json({'_id':newPost._id});
        } catch(err) {
            await contentPost.deleteOne();
            return S3_Services.deleteMediaS3(req.file.key).then(()=>{
                return res.status(400).json({error:errorHandler.getErrorMessage(err)});
            }).catch((err2)=>{
                return res.status(500).json({error:"Posting Server Error: Unable to clean post, cleaned created content, but failed to clean s3"
                + ' because ' + err.message + ' and '+ err2.message});
            })
        }
    })
}

/**
  * @desc Appropriately selects and populates fields of a post
  * @param Object req - HTTP request object
  * @param Object res - HTTP response object
*/ 
const getContentPost = async (req, res) => {
    try {
        let post = await Post.findById(req.params.postId).select('type caption tags postedBy createdAt updatedAt')
            .populate({
                path: 'postedBy',
                select: '_id username profile_photo',
                populate: {
                    path: 'profile_photo',
                    select: "-_id key mimetype blurhash"
                }
            })
            .populate({
                path: 'content',
                select: '-_id price media',
                populate: {
                    path: "media",
                    select: '-_id key mimetype blurhash'
                }
            }).exec()
        return res.status(200).json(post);
    } catch (err) {
        return res.status(500).json({
            error: StaticStrings.UnknownServerError + '\nReason: ' + err.message
        })
    }
}

/**
  * @desc Edits a content post (the caption and tags)
  * @param Object req - HTTP request object
  * @param Object res - HTTP response object
*/ 
const editContentPost = async (req, res) => {
    try {
        let update = {};
        'caption' in req.body ? update.caption = req.body.caption : undefined;
        'tags' in req.body ? update.tags = req.body.tags.split(',').filter(s=>Boolean(s.trim())) : undefined;
        let post = await Post.findByIdAndUpdate(req.params.postId,update,{runValidators:true,new:true});
        return res.status(200).json({'_id': post._id});
    } catch (err) {
        return res.status(400).json({
            error: errorHandler.getErrorMessage(err)
        })
    }
}


export default {
    createContentPost,
    fetchPosts,
    getContentPost,
    editContentPost
}