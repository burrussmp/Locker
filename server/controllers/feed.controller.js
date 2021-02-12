// imports
import User from '@server/models/user.model';
import Organization from '@server/models/organization.model';


/**
 * @desc Get the person's follower feed
 * @param {Request} req : HTTP Request object
 * @param {Response} res : HTTP Response object
 */
const getFollowerFeed = (req, res) => {
    
};

/**
 * @desc Get the person's for you feed
 * @param {Request} req : HTTP Request object
 * @param {Response} res : HTTP Response object
 */
const getForYouFeed = (req, res) => {
    return res.status(500).json({error: 'ERROR'});
};


export default {
    getFollowerFeed,
    getForYouFeed,
};
