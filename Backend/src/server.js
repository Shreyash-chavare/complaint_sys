import express from 'express'
import routes from './routes/index.js'
import dotenv from 'dotenv'
dotenv.config();
import connectDB from './utils/db.js'

const app=express();
const PORT=process.env.PORT || 5005;
connectDB();

app.use(express.json());

app.use('/api',routes);

app.listen(PORT,()=>{
    console.log(`listening on port ${PORT}`);
})



