
// require('dotenv').config({path:'./env'})
import connectDB from "./db/index.js";
import dotenv from "dotenv";

dotenv.config({
    path: './env'
})















connectDB()

// single File Change For Database Connectivity
/*import express from "express"
const app = express()

    (async () => {
        try {
            await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
            app.on("errrrror", () => {
                console.log("Not Supported")
                throw error
            })
            app.listen(process.env.PORT, () => {
                console.log(`LISTINING ON PORT ${process.env.PORT}`)
            })
        } catch (error) {
            console.error(error);
        }
    })();*/