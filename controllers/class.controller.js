import Class from "../models/class.model.js";

export const getclass = async (req, res) => {
    const id = req.params.id;
    
    const classData = await Class.findOne({
        students: { $in: [id] }
    });

    if (!classData) {
        return res.status(404).json({
            msg: "Student not found"
        });
    }

    res.status(200).json({
        msg: `Fetched class for student id: ${id}`,
        class: classData
    });
};

export const getStudents = async (req, res) => {
    const id = req.params.id;

    const classData = await Class.findById({
        _id : id
    })

    if (!classData) {
        return res.status(404).json({
            msg: "Student not found"
        });
    }

    res.status(200).json({
        msg: `Fetched students for class id: ${classData._id}`,
        students: classData.students
    });
};