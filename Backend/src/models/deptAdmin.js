import mongoose from 'mongoose'

const deptAdminSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    
    password: { type: String, required: true },
    employeeId: { type: String },

    department: {
        type: String, required: true, enum: ['IT Support',
            'Electrical',
            'Maintenance',
            'Facilities']
    }, // which dept they manage

    role: { type: String, default: 'DeptAdmin' }
}, { timestamps: true });

export default mongoose.model('DeptAdmin', deptAdminSchema);