import express from 'express';
import cors from 'cors';  
import dotenv from 'dotenv';
import { dbConnect } from './config/db.config.js';
import mainRouter from './routes/index.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;


app.use(cors());
app.use(express.json({
  limit : "30mb",
  extended : true
}));
app.use("/api/v1",mainRouter);



app.listen(PORT, () => {
  dbConnect();
  console.log(`Server is running on port ${PORT}`);
});

