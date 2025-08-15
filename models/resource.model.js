import mongoose from "mongoose";

const resourceSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    link: { type: String, required: true, trim: true },
    type: { type: String, required: true, enum: ["Document", "Yt-Link"] }, // Note: I changed "document" to "Document" to match your frontend code
    subject: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true },
    class: { type: mongoose.Schema.Types.ObjectId, ref: "Class", required: true },
    createdBy: { type: String, required: true },
    // NEW FIELD: Store the extracted text content
    content: { type: String} 
}, { timestamps: true });

const Resource = mongoose.model("Resource", resourceSchema);
export default Resource;
