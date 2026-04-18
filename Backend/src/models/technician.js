import mongoose from 'mongoose'

const technicianSchema = new mongoose.Schema({
    name         : { type: String, required: true },
    email        : { type: String, required: true, unique: true },
    password     : { type: String, required: true },
    employeeId   : { type: String },
    department : {
        type : String,
        enum : [
            'IT Support',
            'Electrical',
            'Maintenance',
            'Facilities'
        ]
    },  // which dept they belong to
    specialization: { type: String }, // specialize w.r.t department
    role         : { type: String, default: 'Technician' }
}, { timestamps: true });

export default mongoose.model('Technician', technicianSchema);