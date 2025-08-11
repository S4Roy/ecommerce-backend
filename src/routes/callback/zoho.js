import { Router } from "express";
import * as callbackController from "../../controllers/callback/index.js";

const zohoRouter = Router();

zohoRouter.get("/redirect", callbackController.zohoController.redirect);
zohoRouter.get("/code", callbackController.zohoController.code);

export { zohoRouter };
