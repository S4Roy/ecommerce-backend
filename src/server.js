import path, { resolve, dirname } from "path";
import express from "express";
import cors from "cors";
import basicAuth from "express-basic-auth";
import bearerToken from "express-bearer-token";
import swaggerUi from "swagger-ui-express";
import { handleError, morganConf, StatusSuccess } from "./config/index.js";
import fileUpload from "express-fileupload";
import Pusher from "pusher";
import mongoose from "./config/mongoose.js";
import * as middleware from "./middleware/index.js";
import i18n from "i18n";
// import rules from "./config/rules.js";
// import bcrypt from "./config/bcrypt.js";
// import mail from "./config/mail.js";
// import db from "./config/database.js";
// import pusherConfig from "./config/pusher.js";
import { v1AuthRouter } from "./routes/auth/index.js";
// import v1AdminRouter from "./routes/api/v1/admin/index.js";
// import indexRoutes from "./routes/index.js";
import { fileURLToPath } from "url";
import { envs } from "./config/index.js";
import { errors } from "celebrate";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// Initialize i18n before using it
i18n.configure({
  locales: ["en"],
  directory: resolve(__dirname, "./assets/locales"),
  defaultLocale: "en",
  objectNotation: true,
});
const app = express();

app.use(i18n.init); // ✅ Middleware for translations
// // Global Configuration
// global.CONFIG = {
//   DIR_PATH: __dirname,
//   rules,
//   bcrypt,
//   mail,
//   db,
//   pusher: pusherConfig,
//   DEMO_AC: "64895d42711473576ce39a7b",
// };
// // console.log(global.CONFIG.db.collections);

// // Initializing Pusher
// global.pusher = new Pusher({
//   appId: CONFIG.pusher.app_id,
//   key: CONFIG.pusher.key,
//   secret: CONFIG.pusher.secret,
//   cluster: CONFIG.pusher.cluster,
//   encryptionMasterKeyBase64: CONFIG.pusher.encryption_key,
// });

// Initialize Express App

// Serve Static Files
app.use("/public", express.static(path.join(__dirname, "../public")));
app.use(morganConf);

// Initialize CORS
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(i18n.init);
app.use(fileUpload());
app.use(express.static("public"));
app.use(bearerToken());
app.use(StatusSuccess);
// Define API Routes
// app.use(`${envs.basePath}/`, indexRoutes);
app.use(`${envs.basePath}/api/v1/auth`, v1AuthRouter);

// app.use(
//   `${envs.basePath}/api/v1/admin`,
//   middleware.validateApiKey,
//   middleware.validateAccessToken,
//   middleware.checkRole([
//     "superadmin",
//     "manager",
//     "operator",
//     "supervisor",
//     "staff",
//   ]),
//   v1AdminRouter
// );

app.use(`${envs.basePath}/public`, express.static("./public"));

// Initialize Swagger UI
app.use(
  "/api-docs/assets",
  express.static(path.join(__dirname, "assets", "swagger"))
);

const swaggerOptions = {
  explorer: true,
  swaggerOptions: {
    urls: [
      { url: "/api-docs/assets/auth.json", name: "AUTH API - v1" },
      { url: "/api-docs/assets/site.json", name: "SITE API - v1" },
      { url: "/api-docs/assets/admin.json", name: "ADMIN API - v1" },
      { url: "/api-docs/assets/debug.json", name: "DEBUG API - v1" },
    ],
  },
};

// Protect Swagger UI with Basic Auth
app.use(
  "/api-docs",
  basicAuth({
    users: { [envs.SWAGGER_UI_ACCESS.USER]: envs.SWAGGER_UI_ACCESS.PASSWORD },
    challenge: true,
    unauthorizedResponse: "Unauthorized access to API documentation",
  }),
  swaggerUi.serve,
  swaggerUi.setup(null, swaggerOptions)
);

console.log("Swagger Docs available at http://localhost:3000/api-docs");

// Handle 404 Errors
app.all(`${envs.basePath}/*`, (req, res) =>
  res.status(404).json({ message: "404 Not Found!" })
);
app.use(errors());
app.use(handleError);
// Start the Server
const PORT = process.env.SERVER_PORT || 3000;
const HOSTNAME = process.env.SERVER_HOSTNAME || "localhost";

app.listen(PORT, HOSTNAME, () => {
  console.log(`Server running at http://${HOSTNAME}:${PORT}/`);
});
