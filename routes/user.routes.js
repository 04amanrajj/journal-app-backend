const express = require("express");
const Router = require("express");
// const { authenticate } = require("../middlewares/authorization.middleware");
const userRoutes = Router();
const {
  userInfo,
  registerUser,
  loginUser,
  logoutUser,
  // userInfo,
  // authenticate,
  // authorize,
} = require("../controllers/user.controller");
const { authenticate } = require("../middlewares/authorization.middleware");
const { checkBlacklist } = require("../middlewares/blacklist.middleware");
require("dotenv").config();

userRoutes.use(express.json());
userRoutes.use(express.urlencoded({ extended: true }));
userRoutes.use(checkBlacklist);
userRoutes.get("/", authenticate, userInfo);
userRoutes.post("/register", registerUser);
userRoutes.post("/login", loginUser);
userRoutes.post("/logout", logoutUser);

module.exports = { userRoutes };
