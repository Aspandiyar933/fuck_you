import mongoose from "mongoose";
import ICode from "../interfaces/code.interface.js";


const codeSchema = new mongoose.Schema(
    {
        code: {type: String, required: true}
    },
    {
        timestamps: true,
    }
);

const Code = mongoose.model<ICode>("Code", codeSchema);
export default Code;