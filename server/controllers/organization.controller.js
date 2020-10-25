"use strict";
// imports
import Organization from "../models/organization.model";
import Media from "../models/media.model";
import errorHandler from "../services/dbErrorHandler";
import StaticStrings from "../../config/StaticStrings";
import S3_Services from "../services/S3.services";

const OrganizationControllerErrors = StaticStrings.OrganizationControllerErrors;

/**
 * @desc Filter organization
 * @param Object User query result
 */
const filter_organization = (organization) => {
    organization.__v = undefined;
    return organization;
};

/**
 * @desc Middleware: Get an organization by ID
 * @param Object req - HTTP request object
 * @param Object res - HTTP response object
 */
const organizationByID = async (req, res, next, id) => {
    try {
        let organization = await Organization.findById(id)
            .populate("logo", "key blurhash mimetype")
            .exec();
        if (!organization)
            return res.status("404").json({
                error: OrganizationControllerErrors.NotFoundError,
            });
        req.organization = organization;
        next();
    } catch (err) {
        return res
            .status("404")
            .json({
                error: OrganizationControllerErrors.NotFoundError
            });
    }
};

/**
 * @desc create a new organization.
 * @param Object req - HTTP request object
 * @param Object res - HTTP response object
 */
const create = async (req, res) => {
    let organization;
    let { name, url, description } = req.body;
    try {
        console.log({
            name: name,
            url: url,
            description: description
        })
        organization = new Organization({
            name: name,
            url: url,
            description: description
        })
        organization = await organization.save();
    } catch(err){
        return res.status(400).json({ error: errorHandler.getErrorMessage(err) });
    }
    let type = 'Logo'
    let media_meta = {
        'type': type,
        'uploadedBy': organization._id
    };
    S3_Services.uploadSingleMediaS3(req, res, media_meta, async (req, res, image) => {
        let query = {'_id' : organization._id};
        let update = {$set: {"logo" : image._id}};
        organization = await Organization.findOneAndUpdate(query, update,{runValidators:true});
        try {
            return res.status(200).json({ '_id': organization._id });
        } catch (err) {
            return S3_Services.deleteMediaS3(req.file.key).then(() => {
                return res.status(400).json({ error: errorHandler.getErrorMessage(err) });
            }).catch((err2) => {
                return res.status(500).json({
                    error: "Server Error: Unable to save logo to S3"
                        + ' because ' + err.message + ' and ' + err2.message
                });
            })
        }
    })
};

/**
 * @desc Read a specific organization
 * @param Object req - HTTP request object
 * @param Object res - HTTP response object
 */
const read = (req, res) => {
    try {
        return res.status(200).json(filter_organization(req.organization));
    } catch (err) {
        return res.status(500).json({
            error: errorHandler.getErrorMessage(err)
        });
    }
};

/**
 * @desc List all organizations
 * @param Object req - HTTP request object
 * @param Object res - HTTP response object
 */
const list = async (req, res) => {
    try {
        const organizations = await Organization.find().select(
            "_id updatedAt createdAt"
        );
        return res.json(organizations);
    } catch (err) {
        return res.status(500).json({
            error: errorHandler.getErrorMessage(err)
        });
    }
};

/**
 * @desc Update an organization
 * @param Object req - HTTP request object
 * @param Object res - HTTP response object
 */
const update = async (req, res) => {
    return res.status(501).json({
        error: StaticStrings.NotImplementedError
    });
};

/**
 * @desc Remove an organization
 * @param Object req - HTTP request object
 * @param Object res - HTTP response object
 */
const remove = async (req, res) => {
    try {
        let deletedOrganization = await req.organization.deleteOne();
        return res.json(deletedOrganization);
    } catch (err) {
        return res.status(500).json({
            error: errorHandler.getErrorMessage(err)
        });
    }
};

export default {
    list,
    create,
    read,
    update,
    remove,
    organizationByID,
};