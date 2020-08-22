"use strict";

// imports
import mongoose from 'mongoose';
import S3_Services from '../S3.services';
import ContentPost from '../../models/posts/content.post.model';
import Post from '../../models/post.model';
import errorHandler from '../dbErrorHandler'

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
        'uploadedBy' : req.auth._id
    };
    S3_Services.uploadMediaS3(req,res,media_meta, async (req,res,image)=>{
        let contentPost = new ContentPost({
            price: req.body.price,
            media: image._id
        })
        try {
            contentPost = await contentPost.save();
        } catch(err) {
            return S3_Services.deleteMediaS3(req.file.key).then(()=>{
                return res.status(400).json({error:errorHandler.getErrorMessage(err)});
            }).catch((err2)=>{
                return res.status(500).json({error:"Posting Server Error: Unable to create content for post and failed to clean s3 "
                + ' because ' + err.message + ' and '+ err2.message});
            })
        }
        let postData = {
            type: type,
            content: contentPost._id,
            postedBy : req.auth._id,
            caption : req.body.caption,
            tags: req.body.tags.split(',')
        };
        let newPost = new Post(postData);
        try {
            newPost = await newPost.save();
            return res.status(200).json(newPost);
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


export default {
    createContentPost,
    fetchPosts
}