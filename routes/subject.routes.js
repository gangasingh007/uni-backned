import express from "express";
import { createSubject, deleteSubject, getSubjects, updateSubject } from "../controllers/subject.controller.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { adminMiddleware } from "../middlewares/adminMiddleware.js";

const router = express.Router();


router.get("/all-subjects/:classid",authMiddleware,getSubjects)
router.post("/create-subject/:id",authMiddleware,adminMiddleware,createSubject);
router.delete("/delete-subject/:classId/:subjectId",authMiddleware,adminMiddleware,deleteSubject);
router.put("/update-subject/:classid/:subjectId",authMiddleware,adminMiddleware,updateSubject);

export default router