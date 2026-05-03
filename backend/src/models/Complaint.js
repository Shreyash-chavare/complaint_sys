import mongoose from "mongoose";

const complaintSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },

  description: {
    type: String,
    required: true
  },

  // Academic = teacher handles | Infrastructure = technician handles
  category: {
    type: String,
    enum: ["Academic", "Infrastructure"],
    required: true
  },

  priority: {
    type: String,
    enum: ["low", "medium", "high"],
    default: "low"
  },

  status: {
    type: String,
    enum: ["open", "assigned", "in_progress", "resolved", "closed", "reopened", "withdrawn"],
    default: "open"
  },

  

  // Structured location instead of plain string
  location: {
    building: { type: String },
    floor:    { type: String },
    room:     { type: String }
  },

  // Replaces single photoUrl — supports photos, videos, docs
  attachments: [
    {
      url:          { type: String, required: true },
      resourceType: { type: String, enum: ["image", "video", "raw"], default: "image" },
      originalName: { type: String }
    }
  ],

  isPrivate: {
    type: Boolean,
    default: false
  },

  // Students who upvoted (only applicable to public complaints)
  upvotes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student"
    }
  ],

  // The student who filed the complaint
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true
  },

  // For Academic complaints — one or more teachers
  assignedTeachers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher"
    }
  ],

  // For Infrastructure complaints — single technician
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Technician"
  },

  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Department"
  },

  slaDeadline: Date,
  resolvedAt:  Date,
  withdrawnAt: Date,

  reopenedCount: {
    type: Number,
    default: 0
  }

}, { timestamps: true });

// Virtual: upvote count (convenience)
complaintSchema.virtual("upvoteCount").get(function () {
  return this.upvotes.length;
});

// Index for fast public feed query
complaintSchema.index({ isPrivate: 1, status: 1, createdAt: -1 });
// Index for student's own complaints
complaintSchema.index({ student: 1, createdAt: -1 });

export default mongoose.model("Complaint", complaintSchema);