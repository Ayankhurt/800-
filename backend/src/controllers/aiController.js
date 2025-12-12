import { GoogleGenerativeAI } from '@google/generative-ai';
import zodToJsonSchema from 'zod-to-json-schema';
import { z } from 'zod';
import { supabase } from '../config/supabaseClient.js';
import { formatResponse } from '../utils/formatResponse.js';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'AIzaSyAYYYjVaUHJk7nNjnvgSAB_Cn_qvMP3pEs');

// Helper to mimic generateObject using Gemini
const generateObject = async ({ model, schema, messages, prompt }) => {
    try {
        const modelName = model || 'gemini-1.5-flash';
        const generativeModel = genAI.getGenerativeModel({
            model: modelName,
            generationConfig: { responseMimeType: "application/json" }
        });

        const content = prompt || (messages ? messages.map(m => m.content).join('\n') : '');
        const jsonSchema = zodToJsonSchema(schema, "response");
        const jsonSchemaString = JSON.stringify(jsonSchema, null, 2);

        const finalPrompt = `${content}\n\nIMPORTANT: Output strictly valid JSON matching this schema:\n${jsonSchemaString}`;

        const result = await generativeModel.generateContent(finalPrompt);
        const text = result.response.text();
        return JSON.parse(text);
    } catch (error) {
        console.error("AI Generation Error:", error);
        throw error;
    }
};

// California Contract Schema
const CaliforniaContractSchema = z.object({
    contractTitle: z.string(),
    parties: z.object({
        owner: z.object({
            name: z.string(),
            address: z.string(),
            phone: z.string(),
            email: z.string()
        }),
        contractor: z.object({
            name: z.string(),
            licenseNumber: z.string(),
            address: z.string(),
            phone: z.string(),
            email: z.string()
        })
    }),
    projectDetails: z.object({
        description: z.string(),
        location: z.string(),
        startDate: z.string(),
        estimatedCompletionDate: z.string()
    }),
    scopeOfWork: z.object({
        phases: z.array(z.object({
            name: z.string(),
            description: z.string(),
            duration: z.string(),
            deliverables: z.array(z.string())
        }))
    }),
    paymentSchedule: z.object({
        totalAmount: z.number(),
        milestones: z.array(z.object({
            name: z.string(),
            description: z.string(),
            percentage: z.number(),
            amount: z.number(),
            dueDate: z.string()
        }))
    }),
    californiaLawProvisions: z.object({
        cslbNotice: z.string(),
        mechanicsLienWarning: z.string(),
        insuranceRequirements: z.string(),
        permitRequirements: z.string(),
        rightToRescind: z.string(),
        disputeResolution: z.string()
    }),
    termsAndConditions: z.array(z.string()),
    warrantyInformation: z.string(),
    changeOrderProcess: z.string()
});

// Generate AI Contract
export const generateContract = async (req, res) => {
    try {
        const userId = req.user.id;
        const { bidId, projectId, ownerNotes } = req.body;

        if (!bidId) {
            return res.status(400).json(formatResponse(false, 'Bid ID required'));
        }

        // 1. Fetch Basic Bid
        const { data: simpleBid, error: simpleBidError } = await supabase
            .from('bids')
            .select('*')
            .eq('id', bidId)
            .single();

        if (simpleBidError || !simpleBid) {
            console.error("Basic Bid Fetch Error:", simpleBidError);
            return res.status(404).json(formatResponse(false, 'Bid not found', simpleBidError));
        }

        // 2. Fetch Project with Owner
        const { data: project, error: projectError } = await supabase
            .from('projects')
            .select('*, owner:users!projects_owner_id_fkey(*)')
            .eq('id', simpleBid.project_id)
            .single();

        if (projectError) {
            console.error("Project Fetch Error:", projectError);
            return res.status(404).json(formatResponse(false, 'Project not found for bid', projectError));
        }

        // 3. Fetch Submitter
        const { data: submitter, error: submitterError } = await supabase
            .from('users')
            .select('*')
            .eq('id', simpleBid.submitted_by)
            .single();

        if (submitterError) {
            console.error("Submitter Fetch Error:", submitterError);
            return res.status(404).json(formatResponse(false, 'Submitter not found', submitterError));
        }

        // Reconstruct object for AI
        const bid = {
            ...simpleBid,
            project: project,
            submitter: submitter
        };

        // Verify user is the owner
        if (bid.project.owner_id !== userId) {
            return res.status(403).json(formatResponse(false, 'Only project owner can generate contract'));
        }

        const startTime = Date.now();

        // Use submitter as contractor
        const contractor = bid.submitter;

        // Generate contract using AI
        const contract = await generateObject({
            messages: [{
                role: 'user',
                content: `Generate a comprehensive construction contract for California with CSLB compliance.

Project Details:
- Title: ${bid.project.title}
- Description: ${bid.project.description}
- Bid Amount: $${bid.amount}
- Timeline: ${bid.timeline_days || 30} days
- Proposal: ${bid.notes || 'As per proposal'}

Owner Information:
- Name: ${bid.project.owner.first_name} ${bid.project.owner.last_name}
- Company: ${bid.project.owner.company_name || 'Individual'}
- Email: ${bid.project.owner.email}
- Phone: ${bid.project.owner.phone || 'Not provided'}
- Location: ${bid.project.owner.location || 'California'}

Contractor Information:
- Name: ${contractor.first_name} ${contractor.last_name}
- Company: ${contractor.company_name || 'Individual'}
- Email: ${contractor.email}
- Phone: ${contractor.phone || 'Not provided'}
- Location: ${contractor.location || 'California'}

Owner Notes: ${ownerNotes || 'None'}

IMPORTANT REQUIREMENTS:
1. Include all California CSLB (Contractors State License Board) required provisions
2. Include mechanic's lien warning as required by California law
3. Include 3-day right to rescind for home improvement contracts
4. Include insurance requirements (liability and workers comp)
5. Include permit requirements
6. Include dispute resolution clause (arbitration/mediation)
7. Break payment into milestones (20-30% per milestone)
8. Include warranty information
9. Include change order process
10. Make it legally compliant with California Civil Code Section 7159

Generate a professional, legally compliant contract.`
            }],
            schema: CaliforniaContractSchema,
            model: 'gemini-1.5-flash'
        });

        const generationTime = Date.now() - startTime;

        // Save to database
        const { data: savedContract, error: saveError } = await supabase
            .from('ai_generated_contracts')
            .insert({
                project_id: projectId || bid.project.id,
                bid_id: bidId,
                owner_notes: ownerNotes,
                generated_contract: contract,
                california_law_provisions: contract.californiaLawProvisions,
                generation_time_ms: generationTime,
                ai_model_version: 'gemini-1.5-flash'
            })
            .select()
            .single();

        if (saveError) throw saveError;

        return res.status(201).json(formatResponse(true, 'Contract generated successfully', {
            contractId: savedContract.id,
            contract: contract,
            generationTimeMs: generationTime
        }));
    } catch (err) {
        console.error('Contract generation error details:', err);
        return res.status(500).json(formatResponse(false, err.message, err));
    }
};

// Get generated contract
export const getContract = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const { data: contract, error } = await supabase
            .from('ai_generated_contracts')
            .select(`
        *,
        project:projects(owner_id, contractor_id)
      `)
            .eq('id', id)
            .single();

        if (error || !contract) {
            return res.status(404).json(formatResponse(false, 'Contract not found'));
        }

        // Verify user is owner or contractor
        if (contract.project.owner_id !== userId && contract.project.contractor_id !== userId) {
            return res.status(403).json(formatResponse(false, 'Access denied'));
        }

        return res.json(formatResponse(true, 'Contract retrieved', contract));
    } catch (err) {
        console.error('Get contract error:', err);
        return res.status(500).json(formatResponse(false, err.message));
    }
};

// Update contract (owner/contractor edits)
export const updateContract = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const { edits, role } = req.body; // role: 'owner' or 'contractor'

        const { data: contract, error: fetchError } = await supabase
            .from('ai_generated_contracts')
            .select(`
        *,
        project:projects(owner_id, contractor_id)
      `)
            .eq('id', id)
            .single();

        if (fetchError || !contract) {
            return res.status(404).json(formatResponse(false, 'Contract not found'));
        }

        // Verify user permission
        if (role === 'owner' && contract.project.owner_id !== userId) {
            return res.status(403).json(formatResponse(false, 'Only owner can make owner edits'));
        }
        if (role === 'contractor' && contract.project.contractor_id !== userId) {
            return res.status(403).json(formatResponse(false, 'Only contractor can make contractor edits'));
        }

        const updateField = role === 'owner' ? 'owner_edits' : 'contractor_edits';

        const { data, error } = await supabase
            .from('ai_generated_contracts')
            .update({ [updateField]: edits })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return res.json(formatResponse(true, 'Contract updated', data));
    } catch (err) {
        console.error('Update contract error:', err);
        return res.status(500).json(formatResponse(false, err.message));
    }
};

// Finalize contract (merge edits)
export const finalizeContract = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const { data: contract, error: fetchError } = await supabase
            .from('ai_generated_contracts')
            .select(`
        *,
        project:projects(owner_id, contractor_id)
      `)
            .eq('id', id)
            .single();

        if (fetchError || !contract) {
            return res.status(404).json(formatResponse(false, 'Contract not found'));
        }

        // Only owner can finalize
        if (contract.project.owner_id !== userId) {
            return res.status(403).json(formatResponse(false, 'Only owner can finalize contract'));
        }

        // Merge all edits into final contract
        const finalContract = {
            ...contract.generated_contract,
            ...contract.owner_edits,
            ...contract.contractor_edits
        };

        const { data, error } = await supabase
            .from('ai_generated_contracts')
            .update({ final_contract: finalContract })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        // Update project status
        await supabase
            .from('projects')
            .update({
                contract_generated_at: new Date().toISOString(),
                status: 'contract_ready'
            })
            .eq('id', contract.project_id);

        return res.json(formatResponse(true, 'Contract finalized', data));
    } catch (err) {
        console.error('Finalize contract error:', err);
        return res.status(500).json(formatResponse(false, err.message));
    }
};

// AI Progress Analysis Schema
const ProgressAnalysisSchema = z.object({
    workQuality: z.enum(['excellent', 'good', 'fair', 'poor', 'unacceptable']),
    completionPercentage: z.number().min(0).max(100),
    issuesDetected: z.array(z.object({
        type: z.enum(['quality', 'safety', 'compliance', 'workmanship', 'materials']),
        severity: z.enum(['critical', 'high', 'medium', 'low']),
        description: z.string(),
        location: z.string().optional()
    })),
    recommendations: z.array(z.string()),
    safetyCompliance: z.object({
        overallStatus: z.enum(['compliant', 'minor_issues', 'major_violations']),
        violations: z.array(z.string()),
        requiredActions: z.array(z.string())
    }),
    qualityMetrics: z.object({
        workmanship: z.number().min(1).max(10),
        materialQuality: z.number().min(1).max(10),
        adherenceToPlans: z.number().min(1).max(10),
        cleanliness: z.number().min(1).max(10)
    }),
    nextSteps: z.array(z.string()),
    estimatedCompletionDate: z.string().optional()
});

// Analyze Progress with AI
export const analyzeProgress = async (req, res) => {
    try {
        const { milestoneId } = req.params;
        const { photoUrls, notes, progressUpdateId } = req.body;

        if (!photoUrls || photoUrls.length === 0) {
            return res.status(400).json(formatResponse(false, 'At least one photo is required for analysis'));
        }

        // Get milestone details
        const { data: milestone, error: milestoneError } = await supabase
            .from('project_milestones')
            .select('*, projects(*)')
            .eq('id', milestoneId)
            .single();

        if (milestoneError || !milestone) {
            return res.status(404).json(formatResponse(false, 'Milestone not found', null, milestoneError));
        }

        const startTime = Date.now();

        // Create AI prompt for progress analysis
        const prompt = `You are a California-licensed construction inspector analyzing progress photos for a ${milestone.projects.category} project.

Milestone: ${milestone.title}
Description: ${milestone.description}
Expected Completion: ${milestone.due_date}
Additional Notes: ${notes || 'None provided'}

Analyze the provided construction progress photos and provide:
1. Overall work quality assessment
2. Estimated completion percentage (0-100%)
3. Any quality, safety, or compliance issues detected
4. Specific recommendations for improvement
5. Safety compliance status (California construction standards)
6. Quality metrics (workmanship, materials, adherence to plans, cleanliness)
7. Next steps to complete this milestone
8. Estimated completion date if not on track

Focus on:
- California building code compliance
- OSHA safety standards
- Workmanship quality
- Material quality
- Adherence to construction plans
- Site cleanliness and organization
- Potential safety hazards

Photos analyzed: ${photoUrls.length}
${photoUrls.map((url, i) => `Photo ${i + 1}: ${url}`).join('\n')}`;

        // Generate analysis using AI
        const analysis = await generateObject({
            model: 'gemini-1.5-flash',
            schema: ProgressAnalysisSchema,
            prompt: prompt
        });

        const generationTime = Date.now() - startTime;

        // Save analysis to database
        const { data: savedAnalysis, error: saveError } = await supabase
            .from('ai_progress_analysis')
            .insert({
                milestone_id: milestoneId,
                progress_update_id: progressUpdateId || null,
                analysis_result: analysis,
                work_quality: analysis.workQuality,
                completion_percentage: analysis.completionPercentage,
                issues_detected: analysis.issuesDetected,
                recommendations: analysis.recommendations,
                compliance_check: analysis.safetyCompliance,
                analyzed_at: new Date().toISOString()
            })
            .select()
            .single();

        if (saveError) {
            console.error('Error saving analysis:', saveError);
        }

        // Update milestone completion percentage
        await supabase
            .from('project_milestones')
            .update({
                completion_percentage: analysis.completionPercentage,
                status: analysis.completionPercentage >= 100 ? 'completed' : 'in_progress',
                updated_at: new Date().toISOString()
            })
            .eq('id', milestoneId);

        return res.status(200).json(formatResponse(true, 'Progress analyzed successfully', {
            analysis: savedAnalysis || analysis,
            generationTimeMs: generationTime,
            photosAnalyzed: photoUrls.length
        }));

    } catch (error) {
        console.error('Analyze progress error:', error);
        return res.status(500).json(formatResponse(false, 'Server error', null, error.message));
    }
};

// AI Timeline Schema
const TimelineSchema = z.object({
    projectDuration: z.object({
        totalDays: z.number(),
        workingDays: z.number(),
        startDate: z.string(),
        endDate: z.string()
    }),
    milestones: z.array(z.object({
        name: z.string(),
        description: z.string(),
        startDate: z.string(),
        endDate: z.string(),
        duration: z.number(),
        dependencies: z.array(z.string()),
        criticalPath: z.boolean(),
        resources: z.array(z.string()),
        deliverables: z.array(z.string())
    })),
    phases: z.array(z.object({
        name: z.string(),
        startDate: z.string(),
        endDate: z.string(),
        milestones: z.array(z.string())
    })),
    criticalPath: z.array(z.string()),
    bufferDays: z.number(),
    weatherContingency: z.number(),
    inspectionPoints: z.array(z.object({
        milestone: z.string(),
        inspectionType: z.string(),
        requiredBy: z.string()
    })),
    risks: z.array(z.object({
        description: z.string(),
        impact: z.enum(['high', 'medium', 'low']),
        mitigation: z.string()
    }))
});

// Generate AI Timeline
export const generateTimeline = async (req, res) => {
    try {
        const { projectId } = req.params;
        const { startDate, constraints, preferences } = req.body;

        // Get project details
        const { data: project, error: projectError } = await supabase
            .from('projects')
            .select('*, bids!bids_project_id_fkey(*)')
            .eq('id', projectId)
            .single();

        if (projectError || !project) {
            return res.status(404).json(formatResponse(false, 'Project not found', null, projectError));
        }

        const acceptedBid = project.bids?.find(b => b.status === 'accepted');

        const startTime = Date.now();

        // Create AI prompt for timeline generation
        const prompt = `You are a California construction project manager creating a detailed timeline for a ${project.category} project.

Project Details:
- Title: ${project.title}
- Description: ${project.description}
- Category: ${project.category}
- Budget: $${project.budget}
- Location: ${project.location}
- Start Date: ${startDate || 'To be determined'}

${acceptedBid ? `Accepted Bid Details:
- Contractor: ${acceptedBid.contractor_id}
- Bid Amount: $${acceptedBid.amount}
- Estimated Duration: ${acceptedBid.estimated_duration || 'Not specified'}
- Proposed Timeline: ${acceptedBid.proposed_timeline || 'Not specified'}` : ''}

${constraints ? `Constraints: ${JSON.stringify(constraints)}` : ''}
${preferences ? `Preferences: ${JSON.stringify(preferences)}` : ''}

Generate a comprehensive project timeline including:
1. Overall project duration (total days and working days)
2. Detailed milestones with:
   - Start and end dates
   - Duration in days
   - Dependencies on other milestones
   - Whether it's on the critical path
   - Required resources
   - Expected deliverables
3. Project phases grouping related milestones
4. Critical path identification
5. Buffer days for contingencies
6. Weather contingency days (California climate)
7. Required inspection points (California building code)
8. Potential risks and mitigation strategies

Consider:
- California building permit timelines
- Required inspections (foundation, framing, electrical, plumbing, final)
- Material lead times
- Weather patterns in California
- Labor availability
- Permit approval times
- HOA approval if applicable`;

        // Generate timeline using AI
        const timeline = await generateObject({
            model: 'gemini-1.5-flash',
            schema: TimelineSchema,
            prompt: prompt
        });

        const generationTime = Date.now() - startTime;

        // Save timeline to database
        const { data: savedTimeline, error: saveError } = await supabase
            .from('ai_timelines')
            .insert({
                project_id: projectId,
                generated_timeline: timeline,
                milestones: timeline.milestones,
                dependencies: timeline.milestones.map(m => ({
                    milestone: m.name,
                    dependencies: m.dependencies
                })),
                critical_path: timeline.criticalPath,
                generation_time_ms: generationTime,
                ai_model_version: 'gemini-1.5-flash',
                created_at: new Date().toISOString()
            })
            .select()
            .single();

        if (saveError) {
            console.error('Error saving timeline:', saveError);
        }

        // Create milestones in project_milestones table
        if (timeline.milestones && timeline.milestones.length > 0) {
            const milestonesToCreate = timeline.milestones.map((m, index) => ({
                project_id: projectId,
                title: m.name,
                description: m.description,
                due_date: m.endDate,
                order_index: index,
                status: 'pending',
                created_at: new Date().toISOString()
            }));

            await supabase
                .from('project_milestones')
                .insert(milestonesToCreate);
        }

        return res.status(200).json(formatResponse(true, 'Timeline generated successfully', {
            timeline: savedTimeline || timeline,
            generationTimeMs: generationTime,
            milestonesCreated: timeline.milestones.length
        }));

    } catch (error) {
        console.error('Generate timeline error details:', error);
        return res.status(500).json(formatResponse(false, 'Server error', error.message));
    }
};
