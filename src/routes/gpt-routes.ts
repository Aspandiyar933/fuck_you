import { Router } from "express";
import GptService from "../services/gpt-services.js";
import GptController from "../controllers/gpt-controller.js";

const gptRouter = Router();
const gptService = new GptService();
const gptController = new GptController(gptService);

gptRouter.post('/generate-and-run-manim/', gptController.getCode);
gptRouter.get('/get-animation/', gptController.getAnimation);

export default gptRouter;