import { z } from 'zod';

// User Registration Schema
export const signupSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    first_name: z.string().min(1, 'First name is required'),
    last_name: z.string().min(1, 'Last name is required'),
    role: z.enum(['project_manager', 'general_contractor', 'subcontractor', 'trade_specialist', 'viewer', 'admin']),
    company_name: z.string().optional(),
    phone: z.string().optional(),
});

// Job Creation Schema
export const jobSchema = z.object({
    title: z.string().min(5, 'Title must be at least 5 characters'),
    descriptions: z.string().min(20, 'Description must be at least 20 characters'),
    budget_min: z.number().nonnegative().optional().default(0),
    budget_max: z.number().nonnegative().optional().default(0),
    locations: z.string().min(1, 'Location is required'),
    trade_type: z.string().default('All'),
    requirements: z.any().optional(),
    start_date: z.string().optional().nullable(),
    end_date: z.string().optional().nullable(),
}).refine((data) => data.budget_max >= data.budget_min, {
    message: "Maximum budget cannot be less than minimum budget",
    path: ["budget_max"],
});

export const validate = (schema) => (req, res, next) => {
    try {
        schema.parse(req.body);
        next();
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: error.errors.map(err => ({
                    field: err.path.join('.'),
                    message: err.message
                }))
            });
        }
        next(error);
    }
};
