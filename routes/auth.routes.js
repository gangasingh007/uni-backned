import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { getMe, login, register, updateUser } from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/register", register);
router.post("/login",login);
router.put("/update",authMiddleware,updateUser);
router.get("/me",authMiddleware,getMe);

export default router;