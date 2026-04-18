import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema({
  complaint: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Complaint",
    required: true
  },

  actor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  action: {
    type: String,
    required: true
  },

  details: String

}, { timestamps: true });

export default mongoose.model("AuditLog", auditLogSchema);