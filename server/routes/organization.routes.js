import { Edit } from "@material-ui/icons";
import express from "express";
import orgCtrl from "../controllers/organization.controller";
import permission from "../permissions";
import multer from 'multer';
const storage = multer.memoryStorage()
const upload = multer({storage: storage});

const OrganizationPermissions = permission.Organization_Permissions;

const router = express.Router();

router.param("organizationId", orgCtrl.organizationByID);

router.route("/api/ent/organizations")
  .get(permission.Authorize([], false), orgCtrl.list)
  .post(permission.Authorize([OrganizationPermissions.Create]), upload.single('media'), orgCtrl.create);

router.route("/api/ent/organizations/:organizationId")
  .get(permission.Authorize([], false), orgCtrl.read)
  .put(permission.Authorize([OrganizationPermissions.Edit]), orgCtrl.update)
  .delete(permission.Authorize([OrganizationPermissions.Delete]), orgCtrl.remove);

export default router;
