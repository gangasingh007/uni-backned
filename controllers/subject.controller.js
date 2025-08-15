import Subject from "../models/Subject.model.js";
import Class from "../models/class.model.js";
import Resource from "../models/resource.model.js";

export const createSubject = async (req, res) => {
    try {
        const classId = req.params.id;
        const { title, subjectTeacher } = req.body;
        if (!title || !subjectTeacher) {
            return res.status(400).json({ msg: "Title and subjectTeacher are required." });
        }
        // Create the subject
        const newSubject = await Subject.create({ title, subjectTeacher });
        // Add subject to class
        const updatedClass = await Class.findByIdAndUpdate(
            classId,
            { $push: { subject: newSubject._id } },
            { new: true }
        );
        if (!updatedClass) {
            // Rollback subject creation if class not found
            await Subject.findByIdAndDelete(newSubject._id);
            return res.status(404).json({ msg: "Class not found." });
        }
        res.status(201).json({
            msg: "Subject created and added to class successfully.",
            subject: newSubject,
            class: updatedClass
        });
    } catch (error) {
        res.status(500).json({ msg: "Server error.", error: error.message });
    }
}

export const deleteSubject = async (req,res) => {
    const {classId} = req.params

    // find if the class exists

    const isClass = await Class.findById(classId);

    if(!isClass){
        return res.status(403).json({
            msg : "The class doesn't exist"
        })
    }

    try {
        const { subjectId } = req.params;

        // Check if the subject exists
        const subject = await Subject.findById(subjectId);
        if (!subject) {
            return res.status(404).json({
                msg: "Subject not found"
            });
        }

        // Remove the subject from the class's subject array
        const updatedClass = await Class.findByIdAndUpdate(
            classId,
            { $pull: { subject: subjectId } },
            { new: true }
        );

        // delete the resources from of that Subject
        await Resource.deleteMany({
            subject: subjectId
        });


        if (!updatedClass) {
            return res.status(404).json({
                msg: "Class not found while updating"
            });
        }

        // Delete the subject document
        await Subject.findByIdAndDelete(subjectId);

        return res.status(200).json({
            msg: "Subject deleted successfully",
            class: updatedClass
        });
    } catch (error) {
        return res.status(500).json({
            msg: "Server error.",
            error: error.message
        });
    }
}

export const updateSubject = async (req,res)=>{
    const {classid} = req.params;
    
    //  find the class if it exists

    const isclass = await Class.findById(classid);

    if (!isclass) {
        return res.status(403).json({
            msg : "The class doesn't exist"
        });
    }

    try {
        const { subjectId } = req.params;
        const { title, subjectTeacher } = req.body;

        // Check if subjectId is provided
        if (!subjectId) {
            return res.status(400).json({
                msg: "Subject ID is required"
            });
        }

        // Find the subject
        const subject = await Subject.findById(subjectId);
        if (!subject) {
            return res.status(404).json({
                msg: "Subject not found"
            });
        }

        // Update the subject fields if provided
        if (title !== undefined) subject.title = title;
        if (subjectTeacher !== undefined) subject.subjectTeacher = subjectTeacher;

        await subject.save();

        return res.status(200).json({
            msg: "Subject updated successfully",
            subject
        });
    } catch (error) {
        return res.status(500).json({
            msg: "Server error.",
            error: error.message
        });
    }
}

export const getSubjects = async (req,res) => {
    const {classid} = req.params;
    
    // find the class

    const classDoc = await Class.findById(classid).populate('subject');
    if (!classDoc) {
        return res.status(403).json({ msg: "The class doesn't exist" });
    }
    return res.status(200).json({
        msg: "Subjects fetched successfully",
        subjects: classDoc.subject
    });
}