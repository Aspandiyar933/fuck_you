import ICode from "../interfaces/code.interface.js";
import { openai } from "../openai.js";
import Database from "../config/db.js";
import Code from "../models/code.model.js";
import { PythonShell } from 'python-shell';
import fs from 'fs';
import path from 'path';
import dbx from "../dbx.js";

const database = new Database();

export default class GptService {
    private systemPrompt: string;
    constructor() {
        database.connect();
        this.systemPrompt = `
            You are a professional teacher who explains math through visualization using Manim. 
            You should create Manim code from the user prompt.
            Please, return your response in the following JSON array format: 
            {
                "manim_code": [
                    {
                        "code": "manim code"
                    }
                ]
            }
            If the user prompt is irrelevant, return an empty array of code.
    `;}
    
    async generateManimCode(userPrompt: string) {
        try{
            const response = await openai.chat.completions.create({
                model: 'gpt-4o',
                messages: [
                    {
                      role: 'system',
                      content: this.systemPrompt,
                    },
                    {
                      role: 'user',
                      content: userPrompt,
                    },
                ],
            });

            const resJson: string | null = response.choices[0].message.content;
            if (resJson) {
                const parsedRes = JSON.parse(resJson);
                const code = parsedRes.manim_code as ICode[];

                if (code.length > 0) {
                    console.log(code);
                    Code.insertMany(code[0]);
                }

                return code;
            } else {
                return [];
            }
        } catch (e: any) {
            console.log(e.message);
            return [];
        }
    }

    async getManimCode(): Promise<string> {
        try {
            const codeDoc = await Code.findOne();
            if(!codeDoc){
                throw new Error('No code found in the database');
            }
            const get_code = codeDoc.code;

            const tempDirPath = path.join(__dirname, 'temp_scripts');
            const tempFilePath = path.join(tempDirPath, 'temp_script.py');

            const outputDir = path.join(__dirname, 'output');
            const outputPath = path.join(outputDir, 'temp_manim.mp4');

            if (!fs.existsSync(tempFilePath)) {
                fs.mkdirSync(tempFilePath);
              }
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir);
            }

            fs.writeFileSync(tempFilePath, get_code);

            const options = {
                args: [tempFilePath, outputPath],
                pythonOptions: ['-u']
            };

            PythonShell.run(path.join(__dirname, 'scripts', 'run_manim.py'), options).then(() => {
                fs.unlinkSync(tempFilePath);
            });

            // Upload to DropBox
            const fileContent = fs.readFileSync(outputPath);
            const dropboxResponse = await dbx.filesUpload({
                path: '/temp_manim.mp4',
                contents: fileContent
            });

            // Optionally, delete the local file
            fs.unlinkSync(outputPath);

            return dropboxResponse.result.path_lower;
        } catch (err) {
            console.error(err);
        } 
    }
}
