import { Router } from "express";
import { adminAuthRouter } from "./admin.js";

const v1AuthRouter = Router();
// All routes go here

v1AuthRouter.use("/admin", adminAuthRouter);

export { v1AuthRouter };
