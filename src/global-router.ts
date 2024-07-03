import { Router } from "express";
import gptRouter from "./routes/gpt-routes.js";

const globalRouter = Router();

globalRouter.use(gptRouter)

export default globalRouter; 