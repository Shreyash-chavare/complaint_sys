import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: "userModel"
  },

  userModel: {
    type: String,
    required: true,
    enum: ["Student", "Teacher", "Technician", "DeptAdmin"]
  },

  message: {
    type: String,
    required: true
  },

  type: {
    type: String,
    enum: [
      "complaint_created",
      "complaint_assigned",
      "status_change",
      "sla_warning",
      "sla_breach",
      "complaint_resolved",
      "complaint_reopened",
      "feedback_received"
    ]
  },

  complaint: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Complaint"
  },

  read: {
    type: Boolean,
    default: false
  }

}, { timestamps: true });

notificationSchema.index({ user: 1, read: 1, createdAt: -1 });

export default mongoose.model("Notification", notificationSchema);