import { Edit } from "@material-ui/icons";
import express from "express";
import orgCtrl from "../controllers/organization.controller";
import permission from "../permissions";

const OrganizationPermissions = permission.Organization_Permissions;

const router = express.Router();

router.param("organizationId", orgCtrl.organizationByID);

router.route("/api/organizations")
  .get(permission.Authorize([], false), orgCtrl.list)
  .post(permission.Authorize([OrganizationPermissions.Create]), orgCtrl.create);

router.route("/api/organizations/:organizationId")
  .get(permission.Authorize([], false), orgCtrl.read)
  .put(permission.Authorize([OrganizationPermissions.Edit]), orgCtrl.update)
  .delete(permission.Authorize([OrganizationPermissions.Delete]), orgCtrl.remove);

export default router;
