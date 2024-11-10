import mongoose, { model, Schema } from "mongoose";
import { userSchema } from "./index.js";

mongoose.set('strictQuery', false);

mongoose.pluralize(null);

const userModel = new Schema(userSchema);

export default model('data', userModel);