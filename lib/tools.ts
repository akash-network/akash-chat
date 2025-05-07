import { tool } from "ai";
import { z } from "zod";

import { imgApiKey, imgEndpoint } from '@/app/config/api';
import { WORKFLOW_OBJ } from '@/app/config/genimg';

export const generateImageTool = tool({
    description: 'Generate an image based on a text prompt',
    parameters: z.object({
        prompt: z.string().describe("The text prompt describing the image to generate. Enhance the user's image request by creating a descriptive image prompt in order to generate a detailed, high-quality image"),
        negative: z.string().optional().describe('Optional negative prompt to specify what not to include in the image'),
    }),
    execute: async ({ prompt, negative }) => {
        try {
            const workflow = {...WORKFLOW_OBJ};
            workflow[6].inputs.text = prompt;
            workflow[71].inputs.text = negative || '';
            workflow[294].inputs.sampler_name = "dpmpp_2m";
            workflow[294].inputs.scheduler = "sgm_uniform";

            const body = {
                preferred_gpus: ["RTX4090", "A10", "A100", "V100-32Gi", "H100"],
                workflow_json: JSON.stringify(workflow)
            };

            const response = await fetch(`${imgEndpoint}/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${imgApiKey}`
                },
                body: JSON.stringify(body),
            });

            const data = await response.json();
            if (data.error) {
                throw new Error(data.error);
            }
            
            return {
                jobId: data.job_id,
                prompt: prompt,
                negative: negative || ''
            };
        } catch (error) {
            console.error('Error generating image:', error);
            throw error;
        }
    },
})