import ICode from "../interfaces/code.interface.js";
import { openai } from "../openai.js";
import Database from "../config/db.js";
import Code from "../models/code.model.js";
import { PythonShell } from 'python-shell';
import fs from 'fs';
import path from 'path';
import dbx from "../dbx.js";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import AWS from 'aws-sdk';  // Updated import

const database = new Database();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


export default class GptService {
    private s3: AWS.S3;
    private bucketName: string;
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
        `;
        this.s3 = new AWS.S3({
            region: process.env.AWS_REGION,
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
        });
        this.bucketName = process.env.AWS_S3_BUCKET_NAME;
    }
    
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

    async runManimCode(): Promise<string> {
        try {
            const codeDoc = await Code.findOne().sort({ _id: -1 }).limit(1);
            if (!codeDoc) {
                throw new Error('No code found in the database');
            }
            const getCode = codeDoc.code;
    
            const tempDirPath = join('/Users/user/fuck_you/', 'temp_scripts');
            const tempFilePath = join(tempDirPath, 'temp_script.py');
            const outputDir = join('/Users/user/fuck_you/', 'output');
            const outputPath = join(outputDir, 'temp_manim.mp4');
    
            if (!fs.existsSync(tempDirPath)) {
                fs.mkdirSync(tempDirPath, { recursive: true });
            }
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }
    
            fs.writeFileSync(tempFilePath, getCode);
    
            // Run the Manim script using PythonShell
            const options = {
                args: [tempFilePath, outputPath],
                pythonOptions: ['-u'],
            };
    
            await PythonShell.run(join('/Users/user/fuck_you/', 'scripts', 'run_manim.py'), options);
    
            if (!fs.existsSync(outputPath)) {
                throw new Error(`Output file not found: ${outputPath}`);
            }
    
            fs.unlinkSync(tempFilePath);
            return outputPath;
        } catch (err) {
            console.error('Error in runManimCode:', err);
            throw err;
        }
    }
    /*
    async saveToDropbox(filePath: string): Promise<string> {
        try {
            const fileContent = fs.readFileSync(filePath);
            const dropboxResponse = await dbx.filesUpload({
                path: '/temp_manim.mp4',
                contents: fileContent
            });
    
            // Optionally, delete the local file
            fs.unlinkSync(filePath);
    
            return dropboxResponse.result.path_lower;
        } catch (err) {
            console.error(err);
            throw err;
        }
    }
    */

    async saveToS3(filePath: string): Promise<string> {
        try {
            const fileContent = fs.readFileSync(filePath);
            const uploadParams = {
                Bucket: this.bucketName,
                Key: `manim-animations/${path.basename(filePath)}`,
                Body: fileContent,
                ContentType: 'video/mp4'
            };
            const data = await this.s3.upload(uploadParams).promise();
            fs.unlinkSync(filePath);
            return data.Location;
        } catch(err) {
            console.error(err);
            throw err;
        }
    }

    async getManimCode(): Promise<string> {
        try {
            const outputPath = await this.runManimCode();
            const s3Url = await this.saveToS3(outputPath);
            return s3Url;
        } catch (err) {
            console.error(err);
            throw err;
        }
    }
}
