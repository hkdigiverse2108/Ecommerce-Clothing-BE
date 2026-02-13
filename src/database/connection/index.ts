import mongoose from "mongoose";

const dbUrl: any = process.env.DB_URL;

const connectDB = async () => {
    try {
        mongoose.set('strictQuery', false)
        await mongoose.connect(dbUrl)
            .then(() => console.log('Database successfully connected'))
            .catch(err => console.log(err));
    } catch (error) {
        console.error("MongoDB connection error:", error);
    }
};

export default connectDB;