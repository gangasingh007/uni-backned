import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { getclass, getStudents } from "../controllers/class.controller.js";

const router = express.Router();


router.get("/getClass/:id",authMiddleware,getclass)
router.get("/getStudents/:id",authMiddleware,getStudents)
router.get("/getClass",authMiddleware,)

export default router;