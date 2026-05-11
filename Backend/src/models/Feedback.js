import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema({
  complaint: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Complaint",
    required: true
  },

  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true
  },

  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },

  comment: String

}, { timestamps: true });

// One feedback per complaint
feedbackSchema.index({ complaint: 1 }, { unique: true });

export default mongoose.model("Feedback", feedbackSchema);