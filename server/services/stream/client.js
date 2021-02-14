/**
 * @desc Stream setup
 * @author Matthew P. Burruss
 * @date 2/12/2021
 */
import stream from 'getstream';

import config from '@config/config';
 

const StreamClient = () => {

    // initialize and authorize the client
    const client = stream.connect(config.stream.key, config.stream.secret);


    /**
     * @property {function} User Get or create a user feed.
     * @property {function} Organization Get or create an organization feed.
     */
    const getOrCreate = {
        /**
         * @desc Get or create a user feed
         * @param {string} userId The ID of the User.
         * @return {stream.Feed} The stream feed. 
         */
        User: (userId) => client.feed('user', userId),
        /**
         * @desc Get or create a user feed
         * @param {string} organizationId The ID of the organization.
         * @return {stream.Feed} The stream feed. 
         */
        Organization: (organizationId) => client.feed('organization', organizationId),
    }

    /**
     * @desc Remove all the activities in a feed.
     * @param {stream.Feed} feed The stream feed.
     * @param {string} foreignId The foreignID to remove all activities in feed
     */
    const removeAllActivities = async (feed, foreignId) => {
        
        await feed.removeActivity({foreignId: foreignId});
    }

    /**
     * @property {function} User Clean user
     * @property {function} Organization Clean organization
     */
    const clean = {
        /**
         * @desc Delete all activities from User feed
         * @param {string} userId The ID of the User.
         */
        User: async (userId) => await removeAllActivities(getOrCreate(userId).User(), userId),
        /**
         * @desc Delete all activities from Organization feed
         * @param {string} organizationId The ID of the organization
         */
        Organization: async (organizationId) => await removeAllActivities(getOrCreate(organizationId).Organization(), organizationId),
    }

    /**
     * @property {function} User Follow a user
     * @property {function} Organization Follow an organization
     */
    const follow = {
        /**
         * @desc userA follows userB feed
         * @param {string} userA A user ID 
         * @param {string} userB A user ID
         */
        User: async (userA, userB) => {
            await getOrCreate.User(userA).follow('user', userB); 
        },
        /**
         * @desc user follows organization feed
         * @param {string} user A user ID 
         * @param {string} organization An organization ID
         */
        Organization: async (user, organization) => {
            await getOrCreate.User(user).follow('organization', organization); 
        }
    }

    /**
     * @property {function} User Unfollow a user
     * @property {function} Organization unfollow an organization
     */
    const unfollow = {
        /**
         * @desc userA unfollows userB feed
         * @param {string} userA A user ID 
         * @param {string} userB A user ID
         */
        User: async (userA, userB) => {
            await getOrCreate.User(userA).unfollow('user', userB); 
        },
        /**
         * @desc user unfollows organization feed
         * @param {string} user A user ID 
         * @param {string} organization An organization ID
         */
        Organization: async (user, organization) => {
            await getOrCreate.User(user).unfollow('organization', organization); 
        }
    }

    /**
     * @property {function} User Get user followers
     * @property {function} Organization Get organization followers
     */
    const getFollowers = {
        /**
         * @desc Get user followers
         * @param {string} user A user ID
         * @param {object} options Options like limit, offset, etc
         */
        User: async (user, options = {}) => {
            await getOrCreate.User(user).followers(options); 
        },
        /**
         * @desc Get organization followers
         * @param {string} organization An organization ID
         * @param {object} options Options like limit, offset, etc
         */
        Organization: async (organization, options = {}) => {
            await getOrCreate.Organization(organization).followers(options); 
        },
    }

    /**
     * @property {function} User Retrieve the feeds followed by user feed
     */
    const getFollowing = {
        /**
         * @desc Get the feeds that the user follows
         * @param {string} user A user ID
         * @param {object} options Options like limit, offset, etc
         */
        User: async (user, options = {}) => {
            await getOrCreate.User(user).following(options); 
        },
    }

    /**
     * @property {function} User Stats of user following
     * @property {function} Organization Stats of organization following
     */
    const getFollowingStats = {
        /**
         * @desc Get the following stats for a user
         * @param {string} user A user ID
         * @param {object} options Options followerSlugs or followingSlugs
         */
        User: async (user, options = {}) => {
            await getOrCreate.User(user).followStats(options); 
        },
        /**
         * @desc Get the following stats for a organization
         * @param {string} organization An organization ID
         * @param {object} options Options followerSlugs or followingSlugs
         */
        Organization: async (organization, options = {}) => {
            await getOrCreate.Organization(organization).followers(options); 
        },
    }

    return {
        clean: clean,
        feed: {
            follow: follow,
            unfollow: unfollow,
            getFollowers: getFollowers,
            getFollowing: getFollowing,
            getFollowingStats: getFollowingStats,
        }
    }
}


export default StreamClient();