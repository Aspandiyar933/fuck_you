import express, {Request, Response} from 'express';
import GptService from "../services/gpt-services.js";

class GptController {
    private userService: GptService
    

    constructor(gptService: GptService) {
        this.userService = gptService
    }
    getCode = async (req: Request, res: Response) => {
        console.log('Received request to generate Manim code.');
        const { userPrompt } = req.body;
        if (!userPrompt) {
            return res.status(400).json({error:'Prompt is required'})
        }
        try {
            const response = await this.userService.generateManimCode(userPrompt);
            res.status(200).json(response);
        } catch (error:any) {
            res.status(500).json({error:error.message})
        }
    }
    getAnimation = async (req: Request, res: Response) => {
        try {
            const animationPath = await this.userService.getManimCode();
            res.json({ success: true, path: animationPath });
        } catch (error) {
            console.error('Error in getAnimationController:', error);
            res.status(500).json({ success: false, error: 'Failed to generate animation' });
        }
    }
}

export default GptController;