import mongoose from 'mongoose'

const studentSchema = new mongoose.Schema({
    name       : { type: String, required: true },
    email      : { type: String, required: true, unique: true },
    password   : { type: String, required: true },
    rollNumber : { type: String },
    department : { type: String },
    year       : { type: Number },
    role       : { type: String, default: 'Student' }
}, { timestamps: true });

export default mongoose.model('Student', studentSchema);