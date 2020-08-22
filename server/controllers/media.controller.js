import express from 'express';
import postCtrl from '../controllers/post.controller';
import commentCtrl from '../controllers/comment.controller';
"use strict";

// imports
import StaticStrings from '../../config/StaticStrings';
import errorHandler from '../services/dbErrorHandler'
import fs from 'fs'
import S3_Services from '../services/S3.services';


/**
  * @desc Get media from S3 bucket
  * @param Object req - HTTP request object
  * @param Object res - HTTP response object
*/ 
const mediaByKey = (req,res,next,key) => {
    // assert that it exists in S3
    S3_Services.fileExistsS3(key).catch((err)=>{
        res.status(400).json({error: StaticStrings.MediaControllerErrors})
    }).then(()=>{
        return next();
    })
}


/**
  * @desc Get media from S3 bucket
  * @param Object req - HTTP request object
  * @param Object res - HTTP response object
*/ 
const getMedia = (req, res) => {
    let key = req.params.key;
    console.log(key)
    S3_Services.getMediaS3(key)
    .catch((err)=>{
        return res.status(404).json({error:err.message})
    }).then((data)=>{
        try {
        res.setHeader('Content-Length', data.ContentLength);
        res.write(data.Body)
        return res.end(null);
        } catch(err) {
            return res.status(500).json({message:StaticStrings.S3ServiceErrors.RetrieveServerError})
        }
    });
  }

  export default {
      mediaByKey,
      getMedia
  }
