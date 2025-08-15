import Subject from "../models/Subject.model.js";
import Class from "../models/class.model.js";
import mongoose from "mongoose";
import { createResourceSchema } from "../types/resource.validatior.js";
import User from "../models/user.model.js";
// import { uploadFromBuffer } from '../utils/cloudinary.js';
// pdf-parse will be imported dynamically to avoid test file access issues
import Resource from '../models/resource.model.js';


export const createYtresource = async (req, res) => {
    try {
        const { classId, subjectId } = req.params;
        const createdBy = req.userId;

        // Validate body using Zod
        const parsedPayload = createResourceSchema.safeParse(req.body);
        if (!parsedPayload.success) {
            return res.status(400).json({ 
                msg: "Invalid data",
                errors: parsedPayload.error.errors
            });
        }

        const { title, link } = parsedPayload.data;

        // Validate ObjectIds
        if (!mongoose.Types.ObjectId.isValid(classId) || !mongoose.Types.ObjectId.isValid(subjectId)) {
            return res.status(400).json({ msg: "Invalid Class or Subject ID format." });
        }

        // Check Class
        const classDoc = await Class.findById(classId);
        if (!classDoc) {
            return res.status(404).json({ msg: "Class not found." });
        }

        // Check Subject
        const subject = await Subject.findById(subjectId);
        if (!subject) {
            return res.status(404).json({ msg: "Subject not found." });
        }

        // Verify subject belongs to class
        if (!classDoc.subject.some(id => id.toString() === subject._id.toString())) {
            return res.status(400).json({ msg: "Subject does not belong to this class." });
        }

        // Check User
        const user = await User.findById(createdBy);
        if (!user) {
            return res.status(404).json({ msg: "User not found." });
        }

        // Create Resource & Update Subject
        const newResource = await Resource.create({
            title,
            link,
            type: "Yt-Link",
            subject: subjectId,
            class: classId,
            createdBy: user.firstName
        });

        await Subject.findByIdAndUpdate(subjectId, {
            $push: { resources: newResource._id }
        });

        res.status(201).json({ 
            msg: "YouTube resource created and added to subject successfully.", 
            resource: newResource, 
            createdBy 
        });
    } catch (error) {
        console.error("Error creating YouTube resource:", error.stack);
        res.status(500).json({ msg: "Server error.", error: error.message });
    }
};


export const getResources = async (req, res) => {
    try {
        const { classId, subjectId } = req.params;

        // Validate IDs
        if (!mongoose.Types.ObjectId.isValid(classId) || !mongoose.Types.ObjectId.isValid(subjectId)) {
            return res.status(400).json({ msg: "Invalid Class or Subject ID format." });
        }

        // Fetch Class
        const classDoc = await Class.findById(classId).lean();
        if (!classDoc) {
            return res.status(404).json({ msg: "Class not found." });
        }

        // Fetch Subject with resources
        const subject = await Subject.findById(subjectId)
            .populate('resources', 'title link type createdBy')
            .lean();
        if (!subject) {
            return res.status(404).json({ msg: "Subject not found." });
        }

        // Verify relationship
        if (!classDoc.subject.some(id => id.equals(subject._id))) {
            return res.status(400).json({ msg: "Subject does not belong to this class." });
        }
        

        res.status(200).json({ 
            msg: "Resources fetched successfully.", 
            resources: subject.resources 
        });

    } catch (error) {
        console.error("Error fetching resources:", error.stack);
        res.status(500).json({ msg: "Server error.", error: error.message });
    }
};



export const deleteResource = async (req,res) => {
    const classId = req.params.classId;
    const subjectId = req.params.subjectId;
    const resourceId = req.params.resourceId;
    const userId = req.userId; // from the authmiddleware

    try {
        // check for the valid class id
    const isvalidclass = await Class.findById({
        _id : classId
    })
    if(!isvalidclass){
        return res.status(401).json({
            msg : "Class dont exist"
        })
    }

    // check for the valid subject id 
    const isvalidsubject = await Subject.findById({
        _id : subjectId
    })
    if(!isvalidsubject){
        return res.status(401).json({
            msg : "Subject dont exist"
        })
    }

    // check for the valid resource id
    const isvalidresource = await Resource.findById({
        _id : resourceId
    })
    if(!isvalidresource){
        return res.status(401).json({
            msg : "Resource dont exist"
        })
    }

    // delete the resource 
    await Resource.findByIdAndDelete({
        _id : resourceId
    })

    res.status(200).json({
        msg : "The resource has been deleted successfully"
    })
    } catch (error) {
        console.log(error);
        res.status(500).json({
            msg : "Server error"
        })
    }
}

export const updateResource = async (req,res) => {
    const classId = req.params.classId;
    const subjectId = req.params.subjectId;
    const resourceId = req.params.resourceId;
    const userId = req.userId; // from the authmiddleware
    const { title, link } = req.body;

    try {
        const isVaildClass = await Class.findById({
            _id : classId
        })
        if(!isVaildClass){
            return res.status(401).json({
                msg : "Class dont exist"
            })
        }

        const isValidSubject = await Subject.findById({
            _id : subjectId
        })

        if(!isValidSubject){
            res.status(401).json({
                msg : "Subject dont exist"
            })
        }
        const isValidResource = await Resource.findById({
            _id : resourceId
        })

        if(!isValidResource){
            res.status(401).json({
                msg : "Resource dont exist"
            })
        }

        // update the resource 
        const updatedResource = await Resource.findByIdAndUpdate({
            _id : resourceId
        },{
            title,
            link
        },{
            new : true
        })

        res.status(200).json({
            msg : "The resource has been updated successfully",
            resource : updatedResource
        })

    } catch (error) {
        console.log(error)
        res.status(500).json({
            msg : "Server error"
        })
    }
}


// export const uploadResourceDocument = async (req, res) => {
//   const { classId, subjectId } = req.params;
//   const { title } = req.body;
//   const { file } = req; // Multer adds this

//   console.log('Request Body (title):', title);
//   console.log('Request File Object (from Multer):', file);

//   // 1. Validation
//   if (!file) {
//     console.error("Validation Failed: No file was received by the server.");
//     return res.status(400).json({ message: 'No file uploaded. Make sure the file is sent correctly.' });
//   }
//   if (!title) {
//     return res.status(400).json({ message: 'Title is required.' });
//   }

//   let textContent = '';

//   try {
//     // 2. Upload file to Cloudinary
//     const uploadResult = await uploadFromBuffer(file.buffer, 'Uniconnect/documents');
//     if (!uploadResult || !uploadResult.secure_url) {
//       throw new Error('Cloudinary upload failed.');
//     }

//     // 3. Parse PDF if buffer exists
//     if (file.buffer) {
//       try {
//         const data = await pdf(file.buffer); // ✅ Pass buffer directly
//         textContent = data.text || '';
//         console.log("PDF parsing successful.");
//       } catch (err) {
//         console.warn("PDF parsing failed:", err.message);
//         textContent = '';
//       }
//     } else {
//       console.error("No file buffer available for PDF parsing.");
//     }

//     // 4. Save resource in DB
//     const newResource = new Resource({
//       title,
//       link: uploadResult.secure_url,
//       type: 'Document',
//       subject: subjectId,
//       class: classId,
//       createdBy: req.user._id,
//       content: textContent,
//     });

//     await newResource.save();

//     // 5. Link resource to subject
//     await Subject.findByIdAndUpdate(subjectId, { $push: { resources: newResource._id } });

//     res.status(201).json({
//       message: 'Document uploaded and resource created successfully!',
//       resource: newResource,
//     });

//   } catch (error) {
//     console.error('Error during resource upload:', error);
//     res.status(500).json({
//       message: 'Server error during file upload.',
//       error: error.message
//     });
//   }
// };
