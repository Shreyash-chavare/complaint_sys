import mongoose from "mongoose";

const complaintSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },

  description: {
    type: String,
    required: true
  },

  category: String,

  priority: {
    type: String,
    enum: ["low", "medium", "high"],
    default: "low"
  },

  status: {
    type: String,
    enum: ["open", "assigned", "in_progress", "resolved", "closed", "reopened"],
    default: "open"
  },

  location: String,

  photoUrl: String,

  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Department"
  },

  slaDeadline: Date,

  resolvedAt: Date,

  reopenedCount: {
    type: Number,
    default: 0
  }

}, { timestamps: true });

export default mongoose.model("Complaint", complaintSchema);