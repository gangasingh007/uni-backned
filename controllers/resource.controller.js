import Subject from "../models/Subject.model.js";
import Class from "../models/class.model.js";
import mongoose from "mongoose";
import { createResourceSchema } from "../types/resource.validatior.js";
import User from "../models/user.model.js";
import Resource from '../models/resource.model.js';
import cloudinary from '../config/cloudinary.js';
import streamifier from 'streamifier';

// Helper function to upload file buffer to Cloudinary
const uploadToCloudinary = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'auto', // Automatically detect file type
        folder: 'uniconnect/documents',
        use_filename: true,
        unique_filename: true,
        ...options
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    // Create a readable stream from buffer and pipe to Cloudinary
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

// Helper function to validate ObjectIds
const validateObjectIds = (ids) => {
  return ids.every(id => mongoose.Types.ObjectId.isValid(id));
};

// Get all class resources for explore page
export const getAllClassResources = async (req, res) => {
  try {
    const allClassData = await Class.find({})
      .select('courseName section semester subject')
      .populate({
        path: 'subject',
        select: 'title subjectTeacher resources',
        populate: {
          path: 'resources',
          select: 'title link type createdAt',
        },
      })
      .lean();

    // Filter out classes that have no subjects or whose subjects have no resources
    const filteredData = allClassData.filter(cls => 
      cls.subject.length > 0 && cls.subject.some(sub => sub.resources.length > 0)
    );

    res.status(200).json({
      message: 'Successfully fetched all class resources.',
      data: filteredData,
    });
  } catch (error) {
    console.error('Error fetching all class resources:', error);
    res.status(500).json({ message: 'Server error while fetching all resources.' });
  }
};

// Upload document to Cloudinary
export const uploadResourceDocument = async (req, res) => {
  const { classId, subjectId } = req.params;
  const { title } = req.body;
  const { file } = req;
  const userId = req.userId || req.user?._id; // Handle both middleware formats

  console.log('Upload request received:', { 
    classId, 
    subjectId, 
    title, 
    fileName: file?.originalname,
    fileSize: file?.size,
    mimeType: file?.mimetype,
    userId 
  });

  // Validation
  if (!validateObjectIds([classId, subjectId])) {
    return res.status(400).json({ 
      message: 'Invalid Class or Subject ID format.' 
    });
  }

  if (!file) {
    return res.status(400).json({ 
      message: 'No file uploaded. Please select a file to upload.' 
    });
  }

  if (!title || title.trim().length < 3) {
    return res.status(400).json({ 
      message: 'Title is required and must be at least 3 characters long.' 
    });
  }

  try {
    // Verify class and subject exist
    const [classDoc, subject, user] = await Promise.all([
      Class.findById(classId),
      Subject.findById(subjectId),
      User.findById(userId)
    ]);

    if (!classDoc) {
      return res.status(404).json({ message: 'Class not found.' });
    }

    if (!subject) {
      return res.status(404).json({ message: 'Subject not found.' });
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Verify subject belongs to class
    if (!classDoc.subject.some(id => id.toString() === subject._id.toString())) {
      return res.status(400).json({ message: 'Subject does not belong to this class.' });
    }

    // Upload file to Cloudinary
    const uploadResult = await uploadToCloudinary(file.buffer, {
      public_id: `${Date.now()}_${file.originalname.split('.')[0]}`,
      metadata: {
        originalName: file.originalname,
        uploadedBy: userId,
        uploadDate: new Date().toISOString()
      }
    });

    console.log('Cloudinary upload successful:', uploadResult.secure_url);

    // Save resource to database
    const newResource = new Resource({
      title: title.trim(),
      link: uploadResult.secure_url,
      type: 'Document',
      subject: subjectId,
      class: classId,
      createdBy: user.firstName, // Store the user's first name as string
      cloudinaryId: uploadResult.public_id
    });

    await newResource.save();

    // Update subject with new resource
    await Subject.findByIdAndUpdate(subjectId, { 
      $push: { resources: newResource._id } 
    });

    console.log('Resource saved to database:', newResource._id);

    res.status(201).json({
      message: 'Document uploaded successfully!',
      resource: newResource,
      fileUrl: uploadResult.secure_url
    });

  } catch (error) {
    console.error('Upload error:', error);
    
    if (error.message.includes('File size too large')) {
      return res.status(400).json({ 
        message: 'File size too large. Maximum allowed size is 25MB.' 
      });
    }
    
    if (error.message.includes('Invalid file type')) {
      return res.status(400).json({ 
        message: 'Invalid file type. Please upload PDF, DOCX, DOC, PPTX, PPT, TXT, JPEG, PNG, or GIF files only.' 
      });
    }

    res.status(500).json({ 
      message: 'Failed to upload document. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Create YouTube resource (using Zod validation)
export const createYtresource = async (req, res) => {
  try {
    const { classId, subjectId } = req.params;
    const createdBy = req.userId;

    // Validate body using Zod
    const parsedPayload = createResourceSchema.safeParse(req.body);
    if (!parsedPayload.success) {
      return res.status(400).json({ 
        message: "Invalid data",
        errors: parsedPayload.error.errors
      });
    }

    const { title, link } = parsedPayload.data;

    // Validate ObjectIds
    if (!validateObjectIds([classId, subjectId, createdBy])) {
      return res.status(400).json({ message: "Invalid ID format." });
    }

    // Verify entities exist and relationships
    const [classDoc, subject, user] = await Promise.all([
      Class.findById(classId),
      Subject.findById(subjectId),
      User.findById(createdBy)
    ]);

    if (!classDoc) {
      return res.status(404).json({ message: "Class not found." });
    }

    if (!subject) {
      return res.status(404).json({ message: "Subject not found." });
    }

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Verify subject belongs to class
    if (!classDoc.subject.some(id => id.toString() === subject._id.toString())) {
      return res.status(400).json({ message: "Subject does not belong to this class." });
    }

    // Create Resource
    const newResource = await Resource.create({
      title,
      link,
      type: "Yt-Link",
      subject: subjectId,
      class: classId,
      createdBy: user.firstName
    });

    // Update Subject
    await Subject.findByIdAndUpdate(subjectId, {
      $push: { resources: newResource._id }
    });

    res.status(201).json({ 
      message: "YouTube resource created successfully.", 
      resource: newResource
    });
  } catch (error) {
    console.error("Error creating YouTube resource:", error);
    res.status(500).json({ 
      message: "Server error.", 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
};

// Get resources for a specific class and subject
export const getResources = async (req, res) => {
  try {
    const { classId, subjectId } = req.params;

    // Validate IDs
    if (!validateObjectIds([classId, subjectId])) {
      return res.status(400).json({ message: "Invalid Class or Subject ID format." });
    }

    // Verify class and subject exist and are related
    const [classDoc, subject] = await Promise.all([
      Class.findById(classId).lean(),
      Subject.findById(subjectId).populate('resources').lean()
    ]);

    if (!classDoc) {
      return res.status(404).json({ message: "Class not found." });
    }

    if (!subject) {
      return res.status(404).json({ message: "Subject not found." });
    }

    // Verify relationship
    if (!classDoc.subject.some(id => id.toString() === subject._id.toString())) {
      return res.status(400).json({ message: "Subject does not belong to this class." });
    }

    res.status(200).json({ 
      message: "Resources fetched successfully.", 
      resources: subject.resources || []
    });

  } catch (error) {
    console.error("Error fetching resources:", error);
    res.status(500).json({ 
      message: "Server error.", 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
};

// Update resource
export const updateResource = async (req, res) => {
  try {
    const { classId, subjectId, resourceId } = req.params;
    const { title, link } = req.body;

    // Validate IDs
    if (!validateObjectIds([classId, subjectId, resourceId])) {
      return res.status(400).json({ message: "Invalid ID format." });
    }

    // Verify all entities exist
    const [classDoc, subject, resource] = await Promise.all([
      Class.findById(classId),
      Subject.findById(subjectId),
      Resource.findById(resourceId)
    ]);

    if (!classDoc) {
      return res.status(404).json({ message: "Class not found." });
    }

    if (!subject) {
      return res.status(404).json({ message: "Subject not found." });
    }

    if (!resource) {
      return res.status(404).json({ message: "Resource not found." });
    }

    // Update resource
    const updatedResource = await Resource.findByIdAndUpdate(
      resourceId,
      { title, link },
      { new: true }
    );

    res.status(200).json({
      message: "Resource updated successfully.",
      resource: updatedResource
    });

  } catch (error) {
    console.error("Error updating resource:", error);
    res.status(500).json({
      message: "Server error.",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Delete resource with Cloudinary cleanup
export const deleteResource = async (req, res) => {
  try {
    const { classId, subjectId, resourceId } = req.params;

    // Validate IDs
    if (!validateObjectIds([classId, subjectId, resourceId])) {
      return res.status(400).json({ message: "Invalid ID format." });
    }

    // Find the resource
    const resource = await Resource.findById(resourceId);
    
    if (!resource) {
      return res.status(404).json({ message: 'Resource not found.' });
    }

    // If it's a document with Cloudinary ID, delete from Cloudinary
    if (resource.type === 'Document' && resource.cloudinaryId) {
      try {
        await cloudinary.uploader.destroy(resource.cloudinaryId, { 
          resource_type: 'raw' 
        });
        console.log('File deleted from Cloudinary:', resource.cloudinaryId);
      } catch (cloudinaryError) {
        console.error('Error deleting from Cloudinary:', cloudinaryError);
        // Continue with database deletion even if Cloudinary deletion fails
      }
    }

    // Delete from database
    await Resource.findByIdAndDelete(resourceId);
    
    // Remove from subject's resources array
    await Subject.findByIdAndUpdate(resource.subject, {
      $pull: { resources: resourceId }
    });

    res.status(200).json({
      message: 'Resource deleted successfully.'
    });

  } catch (error) {
    console.error("Error deleting resource:", error);
    res.status(500).json({
      message: "Server error.",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
