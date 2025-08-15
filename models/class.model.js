import mongoose from "mongoose";

const classShema = new mongoose.Schema({
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
    students : [
        {
            type : mongoose.Schema.Types.ObjectId,
            ref  : "User",
            default : []
        }
    ],
    subject : [
        {
            type : mongoose.Schema.Types.ObjectId,
            ref : "Subject",
            default : []
        }
    ],

},{
    timestamps : true,
})

const Class = mongoose.model("Class",classShema);
export default Class;