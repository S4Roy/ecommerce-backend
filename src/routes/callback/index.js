import { Router } from "express";
import { zohoRouter } from "./zoho.js";

const v1CallbackRouter = Router();
v1CallbackRouter.use("/zoho", zohoRouter);

export { v1CallbackRouter };
