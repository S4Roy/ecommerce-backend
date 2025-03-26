import * as userService from "./user/index.js";
import * as emailTemplateService from "./emailTemplate/index.js";
import * as emailService from "./email/index.js";
// import * as paginationService from "./pagination/index.js";
// import * as primaryIdByUuidService from "./primaryIdByUuid/index.js";
import * as awsService from "./awsService/index.js";
import * as s3HandlerService from "./s3Handler/index.js";
import * as userRoleService from "./userRole/index.js";

export {
  userService,
  userRoleService,
  emailService,
  emailTemplateService,
  awsService,
  s3HandlerService,
};
