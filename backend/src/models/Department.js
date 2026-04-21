import mongoose from "mongoose";

const departmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },

  categoryKeywords: {
    type: [String],
    default: []
  },

  head: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "DeptAdmin"
  }

}, { timestamps: true });

export default mongoose.model("Department", departmentSchema);