import { Router } from "express";
import LicenseeController from "../../controllers/LicenseeController";
import { Authentication } from "../../middlewares/Authentication";
import { LicenseeAuthorization } from "../../middlewares/Authorization";
import { validate, validateQuery } from "../../middlewares/Validator";
import {
    getLicenseeOrganizationsSchema,
    createLicenseeOrganizationSchema,
    updateLicenseeOrganizationSchema,
    createLicenseeOrganizationAdminSchema,
    createLicenseeOrganizationDoctorSchema,
} from "../../schemas";

const licenseeRouter = Router().use("/", Authentication, LicenseeAuthorization);

licenseeRouter.get(
    "/organization/list",
    validateQuery(getLicenseeOrganizationsSchema),
    LicenseeController.getOrganizations,
);
licenseeRouter.post(
    "/organization",
    validate(createLicenseeOrganizationSchema),
    LicenseeController.createOrganization,
);
licenseeRouter.put(
    "/organization/:organizationId",
    validate(updateLicenseeOrganizationSchema),
    LicenseeController.updateOrganization,
);

licenseeRouter.post(
    "/organization/admin",
    validate(createLicenseeOrganizationAdminSchema),
    LicenseeController.createOrganizationAdmin,
);
licenseeRouter.post(
    "/organization/doctor",
    validate(createLicenseeOrganizationDoctorSchema),
    LicenseeController.createOrganizationDoctor,
);

export default licenseeRouter;

