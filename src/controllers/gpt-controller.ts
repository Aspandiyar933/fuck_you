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
        console.log('Received request to get animation.');
        try {
            const dropboxPath = await this.userService.getManimCode();
            res.status(200).json({ dropboxPath });
        } catch (err: any) {
            res.status(500).send('Error generating Manim animation');
        }
    }
}

export default GptController;