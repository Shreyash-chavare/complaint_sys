// controllers/authController.js
import Student from '../models/student.js'
import Teacher from '../models/teacher.js'
import Technician from '../models/technician.js'
import DeptAdmin from '../models/deptAdmin.js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

const getModelByRole = (role) => {
    switch (role) {
        case 'Student': return Student;
        case 'Teacher': return Teacher;
        case 'Technician': return Technician;
        case 'DeptAdmin': return DeptAdmin;
        default: return null;
    }
}

export const login = async (req, res) => {
    try {
        const { email, password, role } = req.body;

        // 1. Get correct model by role
        const Model = getModelByRole(role);
        if (!Model) {
            return res.status(400).json({
                message: 'Invalid role selected'
            });
        }

        // 2. Find user in CORRECT collection
        const user = await Model.findOne({ email });
        if (!user) {
            return res.status(404).json({
                message: `No ${role} found with this email`
            });
        }

        // 3. Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                message: 'Invalid password'
            });
        }

        // 4. Generate token
        const token = jwt.sign(
            { id: user._id, role: role, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        // 5. Send response
        res.status(200).json({
            message: 'Login successful',
            token: token,
            role: role,
            name: user.name
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
}


export const registration = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        // 1. Validate role
        const Model = getModelByRole(role);
        if (!Model) {
            return res.status(400).json({ 
                message: 'Invalid role selected' 
            });
        }

       

        // 2. Check if email already exists in that role's collection
        const existing = await Model.findOne({ email });
        if (existing) {
            return res.status(409).json({ 
                message: `${role} with this email already exists` 
            });
        }

       

        // 3. Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

      
        let userData = { name, email, password: hashedPassword, role };

        if (role === 'Student') {
            const { rollNumber, department, year } = req.body;
            userData = { ...userData, rollNumber, department, year };
        }

        if (role === 'Teacher') {
            const { employeeId, department } = req.body;
            userData = { ...userData, employeeId, department };
        }

        if (role === 'Technician') {
            const { employeeId, department, specialization } = req.body;
            userData = { ...userData, employeeId, department, specialization };
        }

        if (role === 'DeptAdmin') {
            const { employeeId, department } = req.body;
            const existDeptadmin=await Model.findOne({department});
            if(existDeptadmin) return res.status(409).json({
                message:`deptAdmin for ${department} already exist... `
            })
            userData = { ...userData, employeeId, department };
        }

        // 5. Save to correct collection
        const newUser = await Model.create(userData);

        // 6. Send response
        res.status(201).json({
            message : `${role} registered successfully`,
            userId  : newUser._id,
            role    : role,
            name    : newUser.name
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
}