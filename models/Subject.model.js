import mongoose from "mongoose";

const subjectSchema = new mongoose.Schema({
    title : {
        type : String,
        required : true,
        trim : true
    },
    subjectTeacher : { 
        type : String,
        required : true
    },
    resources : [
        {
            type : mongoose.Schema.Types.ObjectId,
            ref : "Resource",
            default : []
        }
    ],
},{timestamps:true})

const Subject = mongoose.model("Subject",subjectSchema);
export default Subject;