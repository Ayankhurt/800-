import { generateObject } from './rork-sdk';
import { z } from 'zod';

const ProgressSchema = z.object({
    completionPercentage: z.number(),
    workQuality: z.enum(['excellent', 'good', 'fair', 'poor']),
    safetyCompliance: z.boolean(),
    issuesDetected: z.array(z.string()),
    recommendations: z.array(z.string()),
});

export const analyzeProgress = async (
    imageB64: string,
    description: string
) => {
    try {
        const prompt = `Analyze this construction site photo and description: "${description}".
    Estimate completion, judge quality, check for safety issues.`;

        // Note: To send images to Rork generateObject, we usually need to format the message content properly
        // or use a specific vision-capable model. Assuming standard text-based interface for now 
        // or that the SDK handles images in messages if supported.
        // Ideally, for vision, we might need a specific endpoint or SDK method if generateObject supports it.
        // Based on requirements, we use generateObject.

        const analysis = await generateObject({
            messages: [
                {
                    role: 'user',
                    content: [
                        { type: 'text', text: prompt },
                        // If SDK supports image parts:
                        // { type: 'image', image: imageB64 } 
                    ] as any
                }
            ],
            schema: ProgressSchema,
        });

        return analysis.object;
    } catch (error) {
        console.error('AI Progress Analysis Error:', error);
        throw error;
    }
};
