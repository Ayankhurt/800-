import { generateText, generateObject } from './rork-sdk';
import { z } from 'zod';

// Contract Schema Definition
// Comprehensive Contract Schema matching Frontend Requirements
const ContractSchema = z.object({
    scope: z.object({
        workBreakdown: z.object({
            phases: z.array(z.object({
                name: z.string(),
                tasks: z.array(z.string()),
                timeline: z.string(),
                dependencies: z.array(z.string()).optional(),
            })),
        }),
        materials: z.object({
            items: z.array(z.object({
                name: z.string(),
                specifications: z.string(),
                quantity: z.string(),
                supplier: z.enum(['owner', 'contractor', 'other']).optional(),
            })),
        }),
        requirements: z.object({
            codes: z.array(z.string()),
            permits: z.array(z.string()),
            inspections: z.array(z.string()),
            qualityStandards: z.array(z.string()),
        }),
        exclusions: z.array(z.string()),
    }),
    contract: z.object({
        contractType: z.string(),
        terms: z.object({
            paymentSchedule: z.array(z.object({
                milestone: z.string(),
                percentage: z.number(),
                amount: z.number(),
                dueDate: z.string(),
            })),
            timeline: z.string(),
            warranty: z.string(),
            liability: z.string(),
            insurance: z.string(),
        }),
    }),
    milestones: z.array(z.object({
        title: z.string(),
        description: z.string(),
        dueDate: z.string(),
        paymentAmount: z.number(),
        deliverables: z.array(z.string()),
        acceptanceCriteria: z.array(z.string()),
        orderNumber: z.number(),
    })),
});

export const generateProContract = async (projectDetails: {
    description: string;
    amount: number;
    ownerName: string;
    contractorName: string;
    state?: string;
}) => {
    try {
        const prompt = `Generate a professional construction contract for the following project:
      Description: ${projectDetails.description}
      Total Amount: $${projectDetails.amount}
      Owner: ${projectDetails.ownerName}
      Contractor: ${projectDetails.contractorName}
      State: ${projectDetails.state || 'California'}
      
      Include specific ${projectDetails.state || 'California'} compliance notices (CSLB, etc.).`;

        const contract = await generateObject({
            messages: [{ role: 'user', content: prompt }],
            schema: ContractSchema,
        });

        return contract.object;
    } catch (error) {
        console.error('AI Contract Generation Error:', error);
        throw error;
    }
};
