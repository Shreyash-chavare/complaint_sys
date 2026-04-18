import mongoose from 'mongoose'

const teacherSchema = new mongoose.Schema({
    name         : { type: String, required: true },
    email        : { type: String, required: true, unique: true },
    password     : { type: String, required: true },
    employeeId   : { type: String },
    department   : { type: String },
    role         : { type: String, default: 'Teacher' }
}, { timestamps: true });

export default mongoose.model('Teacher', teacherSchema);