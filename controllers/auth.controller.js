import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import { userLoginValidator, userRegisterValidator, userUpdateValidator } from "../types/userValidater.js";
import bcrypt from "bcryptjs";
import Class from "../models/class.model.js";

const adminEmails = ["gangasingh1734@gmail.com", "aayush123@gmail.com",]

// Helper to find or create class and return its _id
async function getOrCreateClassId(courseName, section, semester, userId) {
  let classDoc = await Class.findOne({ courseName, section, semester });
  if (!classDoc) {
    classDoc = await Class.create({ courseName, section, semester, students: [userId] });
  } else {
    // Add user to class if not already present
    if (userId && !classDoc.students.includes(userId)) {
      classDoc.students.push(userId);
      await classDoc.save();
    }
  }
  return classDoc._id;
}

export const register = async (req, res) => {
  const { firstName, lastName, email, password, courseName, section, semester, rollNumber } = req.body;
  try {
    if(!firstName || !lastName || !email || !password || !courseName || !section || !semester || !rollNumber) {
      return res.status(400).json({ msg: "All fields are required" });
    }
    const payload = req.body;
    const parsedPayload = userRegisterValidator.safeParse(payload);
    if (!parsedPayload.success) {
      return res.status(400).json({ msg : "Invalid data" });
    }
    // Check if user already exists
    const isExisting = await User.findOne({ $or: [{ email }, { rollNumber }] });
    if(isExisting) {
      return res.status(400).json({ msg: "User already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    // Determine role
    const role = adminEmails.includes(email) ? "admin" : "user";
    // Create user (classId will be set after class is found/created)
    let newUser = await User.create({
      firstName,
      lastName,
      password: hashedPassword,
      email,
      role,
      courseName,
      section,
      semester,
      rollNumber
    });
    // Find or create class and assign user
    const classId = await getOrCreateClassId(courseName, section, semester, newUser._id);
    newUser.classId = classId;
    await newUser.save();
    // Generate token
    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    // Return response
    res.status(201).json({
      msg: "User registered successfully",
      token,
      user: {
        _id: newUser._id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        role: newUser.role,
        courseName: newUser.courseName,
        section: newUser.section,
        semester: newUser.semester,
        rollNumber: newUser.rollNumber,
        classId: newUser.classId,
        profileImage: newUser.profileImage
      }
    });
  } catch (error) {
    res.status(500).json({ msg: "Internal server error", error: error.message });
  }
};

export const login = async (req, res) => {
  const { email , password } = req.body;
  try {
    if(!email || !password) {
      return res.status(400).json({ msg: "email and password are required" });
    }
    const payload = req.body;
    const parsedPayload = userLoginValidator.safeParse(payload);
    if (!parsedPayload.success) {
      return res.status(400).json({ msg : "Invalid data" });
    }
    // Find user by rollNumber
    const user = await User.findOne({ email });
    if(!user) {
      return res.status(400).json({ msg: "User does not exist" });
    }
    // Check password
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if(!isPasswordCorrect) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }
    // Generate token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.status(200).json({
      msg: "User logged in successfully",
      token,
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        courseName: user.courseName,
        section: user.section,
        semester: user.semester,
        rollNumber: user.rollNumber,
        classId: user.classId,
        profileImage: user.profileImage
      }
    });
  } catch (error) {
    res.status(500).json({ msg: "Internal server error", error: error.message });
  }
};

export const updateUser = async (req, res) => {
    const { firstName, lastName, email, courseName, section, semester, rollNumber, password } = req.body;
    
    try {
        if(!firstName || !lastName || !email || !courseName || !section || !semester || !rollNumber) {
            return res.status(400).json({
                msg: "All fields are required"
            });
        }

        const payload = req.body;
        const parsedPayload = userUpdateValidator.safeParse(payload);

        if (!parsedPayload.success) {
            return res.status(400).json({
                msg: "Invalid data",
            });
        }

        if (courseName !== "Btech" && courseName !== "Mtech") {
          return res.status(403).json({
            msg: "Class not Defined"
          });
        }

        const validSemesters = ["1","2","3","4","5","6","7","8"];
        if (!validSemesters.includes(semester)) {
          return res.status(403).json({
            msg: "Semester not Defined"
          });
        }

        const validSections = ["CE","A","B","C","D"];
        if (!validSections.includes(section)) {
          return res.status(403).json({
            msg: "Section not Defined"
          });
        }

        // Fetch the current user
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ msg: "User not found" });
        }

        // Check if class info has changed
        const classChanged =
            user.courseName !== courseName ||
            user.section !== section ||
            user.semester !== semester;

        let newClassId = user.classId;

        if (classChanged) {
            // Remove user from old class
            if (user.classId) {
                await Class.findByIdAndUpdate(
                    user.classId,
                    { $pull: { students: user._id } }
                );
            }

            // Add user to new class (create if not exists)
            newClassId = await getOrCreateClassId(courseName, section, semester, user._id);

            // Update user's classId
            user.classId = newClassId;
        }

        // Prepare update object
        const updateObj = {
            firstName,
            lastName,
            email,
            courseName,
            section,
            semester,
            rollNumber,
            classId: newClassId
        };

        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            updateObj.password = hashedPassword;
        }

        // Update the user
        const updatedUser = await User.findByIdAndUpdate(req.userId, updateObj, { new: true });

        res.status(200).json({
            msg: "User updated successfully",
            user: updatedUser
        });
    } catch (error) {
        res.status(500).json({
            msg: "Internal server error",
            error: error.message
        });
    }
}  

export const getMe = async (req, res) => {
    try {
        // Fetch the user from the database using the userId from the request
        const user = await User.findById(req.userId).select("-password");
        
        if (!user) {
            return res.status(404).json({ error: { message: "User not found" } });
        }

        res.status(200).json({ user });
    } catch (error) {
        console.error("Error fetching user:", error.message);
        res.status(500).json({ error: { message: "Internal server error" } });
    }
};