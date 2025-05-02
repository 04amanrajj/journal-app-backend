const express = require("express");
const Router = require("express");
const userRoutes = Router();
const {
  userInfo,
  registerUser,
  loginUser,
  logoutUser,
} = require("../controllers/user.controller");
const { authenticate } = require("../middlewares/authorization.middleware");
const { checkBlacklist } = require("../middlewares/blacklist.middleware");
require("dotenv").config();

userRoutes.use(express.json());
userRoutes.use(express.urlencoded({ extended: true }));

// Public routes (no authentication required)
userRoutes.post("/register", registerUser);
userRoutes.post("/login", loginUser);

// Protected routes (authentication and blacklist check required)
userRoutes.use(authenticate); // Apply authentication middleware
userRoutes.use(checkBlacklist); // Apply blacklist middleware after authentication
userRoutes.get("/", userInfo);
userRoutes.post("/logout", logoutUser);

module.exports = { userRoutes };