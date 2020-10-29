"use strict";
// imports
import Employee from '../models/employee.model'
import RBAC from '../models/rbac.model';
import Media from '../models/media.model';
import errorHandler from '../services/dbErrorHandler'
import StaticStrings from '../../config/StaticStrings';
import S3_Services from '../services/S3.services';
import _ from 'lodash';
import fs from 'fs';
import mediaController from './media.controller';
import CognitoAPI from '../services/Cognito.services';
import dbErrorHandler from '../services/dbErrorHandler';
import authController from './auth.controller';

const CognitoServices = CognitoAPI.EmployeeCognitoPool

const DefaultProfilePhoto = process.cwd() + "/client/assets/images/profile-pic.png"

const Errors = StaticStrings.EmployeeControllerErrors;

/**
  * @desc Filter employee for only public data
  * @param Object User query result
*/
const filter_employee = (employee) => {
    employee.permissions = undefined;
    employee.__v = undefined;
    return employee
}

/**
  * @desc Query an employee by ID
  * @param Object req - HTTP request object
  * @param Object res - HTTP response object
*/
const employeeByID = async (req, res, next, id) => {
    try {
        const employee = await Employee.findById(id)
            .populate('permissions')
            .populate('profile_photo', 'key blurhash mimetype')
            .exec();
        if (!employee)
            return res.status('404').json({
                error: Errors.EmployeeNotFound
            })
        req.profile = employee
        req.owner = id;
        next()
    } catch (err) {
        return res.status('404').json({ error: Errors.EmployeeNotFound })
    }
}

/**
  * @desc Create a new employee
  * @param Object req - HTTP request object
  * @param Object res - HTTP response object
*/
const create = async (req, res) => {
    const { password, email, role_type} = req.body;
    if (!role_type){
        return res.status(400).json({error: Errors.MissingRoleType});
    }
    let session, cognito_user;
    try {
        session = await CognitoServices.signup(email, password);
    } catch (err) {
        return res.status(400).json({ error: errorHandler.getErrorMessage(err) })
    }
    try {
        cognito_user = CognitoServices.getCognitoUsername(session);
        let role;
        if(authController.isAdmin(req)){
            role = await RBAC.findOne({ 'role': 'admin' });
        } else {
            role = await RBAC.findOne({ 'role': role_type });
            if (!role){
                return res.status(404).json({error: StaticStrings.RBACModelErrors.RoleNotFound});
            }
            if (req.auth.level < role.level){
                return res.status(401).json({error: `Requester authorization too low: Requester level ${req.auth.level} & level of attempt ${role.level}`});
            }
        }
        const new_employee = {
            cognito_username: cognito_user,
            email: email,
            first_name: req.body.first_name,
            last_name: req.body.last_name,
            date_of_birth: req.body.date_of_birth,
            permissions: role._id,
        }
        const employee = new Employee(new_employee)
        await employee.save()
        res.cookie("t", session, {
            expire: new Date() + 9999
        })
        const parsed_session = CognitoServices.parseSession(session);
        return res.json({
            access_token: parsed_session.accessToken,
            id_token: parsed_session.idToken,
            refresh_token: parsed_session.refreshToken,
            _id: employee._id
        })
    } catch (err) {
        CognitoServices.deleteCognitoUser(cognito_user).then(() => {
            return res.status(400).json({ error: errorHandler.getErrorMessage(err) })
        }).catch(err => {
            return res.status(500).json({ error: StaticStrings.UnknownServerError + err });
        })
    }
}

/**
  * @desc Read a specific employee public info
  * @param Object req - HTTP request object
  * @param Object res - HTTP response object
*/
const read = (req, res) => {
    return res.status(200).json(filter_employee(req.profile))
}

/**
  * @desc List all employees
  * @param Object req - HTTP request object
  * @param Object res - HTTP response object
*/
const list = async (req, res) => {
    try {
        const employees = await Employee.find().select('_id email updatedAt createdAt')
        return res.json(employees)
    } catch (err) {
        return res.status(500).json({ error: errorHandler.getErrorMessage(err) });
    }
}

/**
  * @desc Update an employee info
  * @param Object req - HTTP request object
  * @param Object res - HTTP response object
*/
const update = async (req, res) => {
    const fields_allowed = [
        'first_name',
        'last_name',
        'email',
        'date_of_birth',
    ]
    const update_fields = Object.keys(req.body);
    const invalid_fields = _.difference(update_fields, fields_allowed);
    if (invalid_fields.length != 0) {
        return res.status(422).json({ error: `${StaticStrings.BadRequestInvalidFields} ${invalid_fields}` })
    }
    try {
        await CognitoServices.updateCognitoUser(req.auth.cognito_username, req.body)
        const employee = await Employee.findOneAndUpdate({ '_id': req.params.employeeId }, req.body, { new: true, runValidators: true });
        if (!employee) return res.status(500).json({ error: StaticStrings.UnknownServerError }) // possibly unable to fetch
        return res.status(200).json(employee)
    } catch (err) {
        return res.status(400).json({ error: errorHandler.getErrorMessage(err) });
    }
}

/**
  * @desc Remove an employee
  * @param Object req - HTTP request object
  * @param Object res - HTTP response object
*/
const remove = async (req, res) => {
    try {
        const deletedEmployee = await req.profile.deleteOne()
        return res.json(deletedEmployee)
    } catch (err) {
        return res.status(500).json({ error: errorHandler.getErrorMessage(err) });
    }
}

/**
  * @desc Change password for employee
  * @param Object req - HTTP request object
  * @param Object res - HTTP response object
*/
const changePassword = async (req, res) => {
    const fields_required = [
        "password",
        "old_password"
    ]
    // check to see if only contains proper fields
    const update_fields = Object.keys(req.body);
    const fields_needed = _.difference(fields_required, update_fields);
    if (fields_needed.length != 0) {
        return res.status(422).json({ error: `${StaticStrings.BadRequestFieldsNeeded} ${fields_needed}` })
    }
    // check to see if it has an extra fields
    const fields_extra = _.difference(update_fields, fields_required);
    if (fields_extra.length != 0) {
        return res.status(422).json({ error: `${StaticStrings.BadRequestInvalidFields} ${fields_extra}` })
    }
    if (req.body.old_password == req.body.password) {
        return res.status(400).json({ error: Errors.PasswordUpdateSame })
    }
    try {
        await CognitoServices.changePassword(req.query.access_token, req.body.old_password, req.body.password)
        return res.status(200).json({ message: StaticStrings.UpdatedPasswordSuccess });
    } catch (err) {
        const errMessage = dbErrorHandler.getErrorMessage(err);
        if (errMessage == 'Incorrect username or password.') {
            res.status(400).json({ error: Errors.PasswordUpdateIncorrectError });
        } else {
            return res.status(400).json({ error: errMessage });
        }

    }
}

/**
  * @desc Get profile photo (if not uploaded, default image is sent)
  * @param Object req - HTTP request object
  * @param Object res - HTTP response object
*/
const getProfilePhoto = (req, res) => {
    if (req.profile.profile_photo && req.profile.profile_photo.key) {
        res.locals.key = req.profile.profile_photo.key;
        mediaController.getMedia(req, res);
    } else {
        fs.createReadStream(DefaultProfilePhoto).pipe(res)
    }
}

/**
  * @desc Upload profile photo to S3 bucket and update MongoDB
  * @param Object req - HTTP request object
  * @param Object res - HTTP response object
*/
const uploadProfilePhoto = (req, res) => {
    let meta = {
        'type': "Avatar",
        'uploadedBy': req.params.employeeId,
        'uploadedByType': 'employee'
    };
    S3_Services.uploadSingleMediaS3(req, res, meta, async (req, res, image) => { // upload to s3
        const query = { '_id': req.params.employeeId }; // at this point we have uploaded to S3 and just need to clean up
        const update = { $set: { "profile_photo": image._id } };
        try {
            const employee = await Employee.findOneAndUpdate(query, update, { runValidators: true }); // update
            if (employee.profile_photo) {
                const media = await Media.findOne({ key: req.profile.profile_photo.key });
                await media.deleteOne();
                res.status(200).json({ message: StaticStrings.UploadProfilePhotoSuccess })
            } else {
                res.status(200).json({ message: StaticStrings.UploadProfilePhotoSuccess }) // first upload, nothing to delete... Success!
            }
        } catch (err) {
            if (req.file) {
                await image.deleteOne() // delete the new one
                res.status(500).json({ error: StaticStrings.UnknownServerError + ' and ' + err.message })
            } else {
                res.status(500).json({ error: StaticStrings.UnknownServerError + ' and ' + err.message }) // should never see this... if we have req.file we parsed correctly
            }
        }
    })
}

/**
  * @desc Remove profile photo from S3 bucket and MongoDB
  * @param Object req - HTTP request object
  * @param Object res - HTTP response object
*/
const removeProfilePhoto = async (req, res) => {
    const query = { '_id': req.params.employeeId };
    const update = { $unset: { "profile_photo": "" } };
    const employee = req.profile;
    try {
        await Employee.findOneAndUpdate(query, update)
        if (employee.profile_photo && employee.profile_photo.key) {
            await employee.profile_photo.deleteOne();
            res.status(200).json({ message: StaticStrings.RemoveProfilePhotoSuccess }) // Successfully removed photo
        } else {
            res.status(404).json({ error: StaticStrings.UserControllerErrors.ProfilePhotoNotFound }); // no profile to remove
        }
    } catch (err) {
        res.status(500).json({ error: StaticStrings.UnknownServerError + err.message }) // some other error
    }
}

/**
  * @desc Change an employee's permissions
  * @param Object req - HTTP request object
  * @param Object res - HTTP response object
*/
const changeRole = async (req, res) => {
    const {new_role} = req.body;
    const employeeId = req.params.employeeId;
    const employee = await Employee.findById(employeeId).populate('permissions').exec();
    if (!employee){
        return res.status(404).json({error: Errors.EmployeeNotFound + ` (Requested ID ${employeeId})`});
    }
    const employeeRole = employee.permissions;
    const newRole = await RBAC.findOne({'role': new_role});
    if (!newRole){
        return res.status(400).json({error: StaticStrings.RBACModelErrors.RoleNotFound});
    }
    if (req.auth.level < newRole.level){
        return res.status(401).json({error: `Requester authorization too low: Requester level ${req.auth.level} & level of attempt ${newRole.level}`})
    }
    if (employeeRole.level < req.auth.level){
        return res.status(401).json({error: `Employee you are trying to change has higher authorization.`}) 
    }
    try {
        const update = {'permissions': newRole._id};
        const query = {'_id': employeeId}
        await Employee.findOneAndUpdate(query, update)
        return res.status(200);
    } catch (err) {
        res.status(500).json({ error: StaticStrings.UnknownServerError + err.message }) // some other error
    }
}


export default {
    create,
    employeeByID,
    read,
    list,
    remove,
    update,
    getProfilePhoto,
    uploadProfilePhoto,
    removeProfilePhoto,
    changePassword,
    changeRole,
}
