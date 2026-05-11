import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import Department from '../models/Department.js';

const DEPARTMENTS = [
  {
    name: 'IT Support',
    categoryKeywords: ['wifi', 'internet', 'network', 'server', 'software', 'computer', 'laptop', 'printer', 'login', 'password', 'email', 'system']
  },
  {
    name: 'Electrical',
    categoryKeywords: ['power', 'electricity', 'ac', 'air conditioner', 'fan', 'wiring', 'light', 'bulb', 'switch', 'socket', 'voltage', 'generator']
  },
  {
    name: 'Maintenance',
    categoryKeywords: ['plumbing', 'water', 'leak', 'furniture', 'chair', 'desk', 'table', 'door', 'window', 'lock', 'paint', 'wall', 'ceiling', 'floor', 'tile', 'cleaning']
  },
  {
    name: 'Facilities',
    categoryKeywords: ['parking', 'garden', 'canteen', 'washroom', 'toilet', 'bathroom', 'elevator', 'lift', 'security', 'cctv', 'gate']
  }
];

const seedDepartments = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    for (const dept of DEPARTMENTS) {
      const existing = await Department.findOne({ name: dept.name });
      if (existing) {
        // Update keywords if department exists
        existing.categoryKeywords = dept.categoryKeywords;
        await existing.save();
        console.log(`  Updated: ${dept.name}`);
      } else {
        await Department.create(dept);
        console.log(`  Created: ${dept.name}`);
      }
    }

    console.log('Department seeding complete!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err.message);
    process.exit(1);
  }
};

seedDepartments();
