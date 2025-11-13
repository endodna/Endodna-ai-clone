import { Router } from "express";
import { Authentication } from "../../middlewares/Authentication";
import MiscController from "../../controllers/MiscController";

const miscRouter = Router().use("/", Authentication);

// Routes
miscRouter.get("/menu", MiscController.getMenu);
miscRouter.get("/constants", MiscController.getConstants);

export default miscRouter;
