import mongoose from "mongoose";  

const userSchema = new mongoose.Schema({
    firstName :{
        type : String,
        required : true,
        trim: true,
        minlength: 3,
        maxlength: 50
    },
    lastName: {
        type: String,
        required: true,
        trim: true,
        minlength: 3,
        maxlength: 50
    },
    password : {
        type: String,
        required: true,
        minlength: 6,
        maxlength: 1024
    },
    email : {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    courseName: {
        type: String,
        required: true,
        enum : ["Btech","Mtech"],
        trim: true,
    },
    section : {
        type: String,
        required: true,
        enum : ["A","B","C","D","CE"],
        trim: true,
    },
    semester :{
        type: String,
        required: true,
        enum : ["1","2","3","4","5","6","7","8"],
        trim: true,
    },
    rollNumber: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 5,
    },
    classId :{
        type : mongoose.Schema.Types.ObjectId,
        ref : "Class",
        default : null
    }
},{timestamps: true});

const User = mongoose.model("User", userSchema);
export default User;