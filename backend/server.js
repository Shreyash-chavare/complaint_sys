import dotenv from "dotenv";
import connectDB from "./src/config/db.js";
import app from "./src/app.js";

dotenv.config(); // load env variables

// connect to database
connectDB();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});