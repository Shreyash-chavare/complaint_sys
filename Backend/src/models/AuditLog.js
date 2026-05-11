import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema({
  complaint: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Complaint",
    required: true
  },

  actor: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: "actorModel"        // dynamic ref based on actorModel field
  },

  actorModel: {
    type: String,
    required: true,
    enum: ["Student", "Teacher", "Technician", "DeptAdmin", "SuperAdmin"]
  },

  action: {
    type: String,
    required: true
  },

  details: String

}, { timestamps: true });

export default mongoose.model("AuditLog", auditLogSchema);