import Stripe from 'stripe';
import { supabase } from '../config/supabaseClient.js';
import { formatResponse } from '../utils/formatResponse.js';
import logger from '../utils/logger.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Create Stripe Connect Account for Contractor
export const createConnectAccount = async (req, res) => {
    try {
        const userId = req.user.id;
        const { businessType, businessInfo } = req.body;

        // Verify user is a contractor
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();

        if (userError || !user) {
            return res.status(404).json(formatResponse(false, 'User not found'));
        }

        if (!['contractor', 'general_contractor', 'subcontractor', 'trade_specialist'].includes(user.role)) {
            return res.status(403).json(formatResponse(false, 'Only contractors can create connect accounts'));
        }

        // Check if account already exists
        if (user.stripe_account_id) {
            return res.status(400).json(formatResponse(false, 'Stripe account already exists', {
                accountId: user.stripe_account_id
            }));
        }

        // Create Stripe Connect account
        const account = await stripe.accounts.create({
            type: 'express',
            country: 'US',
            email: user.email,
            business_type: businessType || 'individual',
            capabilities: {
                card_payments: { requested: true },
                transfers: { requested: true },
            },
            business_profile: {
                name: businessInfo?.businessName || user.company_name || `${user.first_name} ${user.last_name}`,
                product_description: 'Construction and contracting services',
                support_email: user.email,
            },
        });

        // Save account ID to database
        const { error: updateError } = await supabase
            .from('users')
            .update({
                stripe_account_id: account.id,
                stripe_account_status: 'pending',
                updated_at: new Date().toISOString()
            })
            .eq('id', userId);

        if (updateError) {
            logger.error('Error saving Stripe account:', updateError);
        }

        // Create account link for onboarding
        const accountLink = await stripe.accountLinks.create({
            account: account.id,
            refresh_url: `${process.env.FRONTEND_URL}/contractor/stripe/refresh`,
            return_url: `${process.env.FRONTEND_URL}/contractor/stripe/return`,
            type: 'account_onboarding',
        });

        return res.status(201).json(formatResponse(true, 'Stripe account created', {
            accountId: account.id,
            onboardingUrl: accountLink.url
        }));

    } catch (error) {
        logger.error('Create connect account error details:', error);
        return res.status(500).json(formatResponse(false, 'Server error', error.message));
    }
};

// Get Connect Account Status
export const getConnectAccountStatus = async (req, res) => {
    try {
        const userId = req.user.id;

        const { data: user, error: userError } = await supabase
            .from('users')
            .select('stripe_account_id, stripe_account_status')
            .eq('id', userId)
            .single();

        if (userError || !user) {
            return res.status(404).json(formatResponse(false, 'User not found'));
        }

        if (!user.stripe_account_id) {
            return res.status(404).json(formatResponse(false, 'No Stripe account found'));
        }

        // Get account details from Stripe
        const account = await stripe.accounts.retrieve(user.stripe_account_id);

        // Update status in database
        const status = account.charges_enabled ? 'active' : 'pending';
        await supabase
            .from('users')
            .update({
                stripe_account_status: status,
                updated_at: new Date().toISOString()
            })
            .eq('id', userId);

        return res.status(200).json(formatResponse(true, 'Account status retrieved', {
            accountId: account.id,
            chargesEnabled: account.charges_enabled,
            payoutsEnabled: account.payouts_enabled,
            detailsSubmitted: account.details_submitted,
            status: status
        }));

    } catch (error) {
        logger.error('Get account status error:', error);
        return res.status(500).json(formatResponse(false, 'Server error', null, error.message));
    }
};

// Create Account Link (for re-onboarding)
export const createAccountLink = async (req, res) => {
    try {
        const userId = req.user.id;

        const { data: user, error: userError } = await supabase
            .from('users')
            .select('stripe_account_id')
            .eq('id', userId)
            .single();

        if (userError || !user || !user.stripe_account_id) {
            return res.status(404).json(formatResponse(false, 'Stripe account not found'));
        }

        const accountLink = await stripe.accountLinks.create({
            account: user.stripe_account_id,
            refresh_url: `${process.env.FRONTEND_URL}/contractor/stripe/refresh`,
            return_url: `${process.env.FRONTEND_URL}/contractor/stripe/return`,
            type: 'account_onboarding',
        });

        return res.status(200).json(formatResponse(true, 'Account link created', {
            url: accountLink.url
        }));

    } catch (error) {
        logger.error('Create account link error:', error);
        return res.status(500).json(formatResponse(false, 'Server error', null, error.message));
    }
};

// Deposit to Escrow
export const depositToEscrow = async (req, res) => {
    try {
        const { projectId } = req.params;
        const userId = req.user.id;
        const { amount, paymentMethodId, milestoneId } = req.body;

        // Get project details
        const { data: project, error: projectError } = await supabase
            .from('projects')
            .select('*, contractor:users!fk_projects_contractor_id(stripe_account_id)')
            .eq('id', projectId)
            .single();

        if (projectError || !project) {
            return res.status(404).json(formatResponse(false, 'Project not found'));
        }

        // Verify user is the owner
        if (project.owner_id !== userId) {
            return res.status(403).json(formatResponse(false, 'Only project owner can deposit to escrow'));
        }

        // Verify contractor has Stripe account
        if (!project.contractor.stripe_account_id) {
            return res.status(400).json(formatResponse(false, 'Contractor has not set up payment account'));
        }

        // Create payment intent with transfer to contractor on hold
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100), // Convert to cents
            currency: 'usd',
            payment_method: paymentMethodId,
            confirm: true,
            description: `Escrow deposit for project: ${project.title}`,
            metadata: {
                project_id: projectId,
                milestone_id: milestoneId || 'initial_deposit',
                owner_id: userId,
                contractor_id: project.contractor_id
            },
            // Don't transfer yet - hold in platform account
            application_fee_amount: Math.round(amount * 100 * 0.05), // 5% platform fee
        });

        // Save escrow transaction
        const { data: escrow, error: escrowError } = await supabase
            .from('escrow_transactions')
            .insert({
                project_id: projectId,
                milestone_id: milestoneId,
                amount: amount,
                status: 'held',
                stripe_payment_intent_id: paymentIntent.id,
                deposited_by: userId,
                deposited_at: new Date().toISOString(),
                created_at: new Date().toISOString()
            })
            .select()
            .single();

        if (escrowError) {
            logger.error('Error saving escrow:', escrowError);
        }

        return res.status(201).json(formatResponse(true, 'Funds deposited to escrow', {
            escrow: escrow,
            paymentIntentId: paymentIntent.id,
            amount: amount,
            status: 'held'
        }));

    } catch (error) {
        logger.error('Deposit to escrow error:', error);
        return res.status(500).json(formatResponse(false, 'Server error', null, error.message));
    }
};

// Release Escrow to Contractor
export const releaseEscrow = async (req, res) => {
    try {
        const { projectId } = req.params;
        const userId = req.user.id;
        const { escrowId, milestoneId } = req.body;

        // Get escrow transaction
        const { data: escrow, error: escrowError } = await supabase
            .from('escrow_transactions')
            .select('*, projects(*, contractor:users!fk_projects_contractor_id(stripe_account_id))')
            .eq('id', escrowId)
            .eq('project_id', projectId)
            .single();

        if (escrowError || !escrow) {
            return res.status(404).json(formatResponse(false, 'Escrow transaction not found'));
        }

        // Verify user is the owner
        if (escrow.projects.owner_id !== userId) {
            return res.status(403).json(formatResponse(false, 'Only project owner can release escrow'));
        }

        // Verify escrow is in held status
        if (escrow.status !== 'held') {
            return res.status(400).json(formatResponse(false, `Escrow is already ${escrow.status}`));
        }

        // Transfer funds to contractor
        const transfer = await stripe.transfers.create({
            amount: Math.round(escrow.amount * 100 * 0.95), // 95% after platform fee
            currency: 'usd',
            destination: escrow.projects.contractor.stripe_account_id,
            description: `Payment for project: ${escrow.projects.title}`,
            metadata: {
                project_id: projectId,
                milestone_id: milestoneId || escrow.milestone_id,
                escrow_id: escrowId
            },
            source_transaction: escrow.stripe_payment_intent_id,
        });

        // Update escrow status
        const { data: updated, error: updateError } = await supabase
            .from('escrow_transactions')
            .update({
                status: 'released',
                released_at: new Date().toISOString(),
                stripe_transfer_id: transfer.id,
                updated_at: new Date().toISOString()
            })
            .eq('id', escrowId)
            .select()
            .single();

        if (updateError) {
            logger.error('Error updating escrow:', updateError);
        }

        // Update milestone payment status if applicable
        if (milestoneId) {
            await supabase
                .from('project_milestones')
                .update({
                    payment_status: 'paid',
                    paid_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', milestoneId);
        }

        return res.status(200).json(formatResponse(true, 'Escrow released to contractor', {
            escrow: updated,
            transferId: transfer.id,
            amount: escrow.amount
        }));

    } catch (error) {
        logger.error('Release escrow error:', error);
        return res.status(500).json(formatResponse(false, 'Server error', null, error.message));
    }
};

// Auto-release on Milestone Approval
export const autoReleaseOnApproval = async (milestoneId) => {
    try {
        // Get milestone details
        const { data: milestone, error: milestoneError } = await supabase
            .from('project_milestones')
            .select('*, projects(*, contractor:users!fk_projects_contractor_id(stripe_account_id))')
            .eq('id', milestoneId)
            .single();

        if (milestoneError || !milestone) {
            logger.error('Milestone not found for auto-release');
            return;
        }

        // Check if milestone has escrow
        const { data: escrow, error: escrowError } = await supabase
            .from('escrow_transactions')
            .select('*')
            .eq('milestone_id', milestoneId)
            .eq('status', 'held')
            .single();

        if (escrowError || !escrow) {
            logger.warn('No held escrow found for milestone');
            return;
        }

        // Transfer funds to contractor
        const transfer = await stripe.transfers.create({
            amount: Math.round(escrow.amount * 100 * 0.95), // 95% after platform fee
            currency: 'usd',
            destination: milestone.projects.contractor.stripe_account_id,
            description: `Auto-release for milestone: ${milestone.title}`,
            metadata: {
                project_id: milestone.project_id,
                milestone_id: milestoneId,
                escrow_id: escrow.id,
                auto_release: 'true'
            },
            source_transaction: escrow.stripe_payment_intent_id,
        });

        // Update escrow status
        await supabase
            .from('escrow_transactions')
            .update({
                status: 'released',
                released_at: new Date().toISOString(),
                stripe_transfer_id: transfer.id,
                updated_at: new Date().toISOString()
            })
            .eq('id', escrow.id);

        // Update milestone payment status
        await supabase
            .from('project_milestones')
            .update({
                payment_status: 'paid',
                paid_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq('id', milestoneId);

        logger.info(`Auto-released escrow for milestone ${milestoneId}`);

    } catch (error) {
        logger.error('Auto-release error:', error);
    }
};

// Stripe Webhook Handler
export const handleWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    // Use rawBody captured in server.js middleware
    const payload = req.rawBody || req.body;

    try {
        event = stripe.webhooks.constructEvent(payload, sig, webhookSecret);

    } catch (err) {
        logger.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
        case 'account.updated':
            const account = event.data.object;
            // Update contractor account status
            await supabase
                .from('users')
                .update({
                    stripe_account_status: account.charges_enabled ? 'active' : 'pending',
                    updated_at: new Date().toISOString()
                })
                .eq('stripe_account_id', account.id);
            break;

        case 'payment_intent.succeeded':
            const paymentIntent = event.data.object;
            logger.info('PaymentIntent succeeded:', paymentIntent.id);
            break;

        case 'payment_intent.payment_failed':
            const failedPayment = event.data.object;
            logger.error('PaymentIntent failed:', failedPayment.id);
            // Update escrow status to failed
            await supabase
                .from('escrow_transactions')
                .update({
                    status: 'failed',
                    updated_at: new Date().toISOString()
                })
                .eq('stripe_payment_intent_id', failedPayment.id);
            break;

        case 'transfer.created':
            const transfer = event.data.object;
            logger.info('Transfer created:', transfer.id);
            break;

        default:
            logger.info(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
};

// Get Escrow Transactions for Project
export const getEscrowTransactions = async (req, res) => {
    try {
        const { projectId } = req.params;
        const userId = req.user.id;

        // Verify user has access to project
        const { data: project, error: projectError } = await supabase
            .from('projects')
            .select('owner_id, contractor_id')
            .eq('id', projectId)
            .single();

        if (projectError || !project) {
            return res.status(404).json(formatResponse(false, 'Project not found'));
        }

        if (project.owner_id !== userId && project.contractor_id !== userId) {
            return res.status(403).json(formatResponse(false, 'Access denied'));
        }

        // Get all escrow transactions
        const { data: transactions, error: transError } = await supabase
            .from('escrow_transactions')
            .select('*')
            .eq('project_id', projectId)
            .order('created_at', { ascending: false });

        if (transError) {
            return res.status(500).json(formatResponse(false, 'Error fetching transactions', null, transError));
        }

        return res.status(200).json(formatResponse(true, 'Escrow transactions retrieved', {
            transactions: transactions
        }));

    } catch (error) {
        logger.error('Get escrow transactions error:', error);
        return res.status(500).json(formatResponse(false, 'Server error', null, error.message));
    }
};

// Get All Payments (Admin/Finance)
export const getAllPayments = async (req, res) => {
    try {
        const { status, limit, offset, sort } = req.query;

        // Simple query without complex nested relationships
        let query = supabase
            .from('escrow_transactions')
            .select('*', { count: 'exact' });

        if (status) {
            query = query.eq('status', status);
        }

        if (sort) {
            query = query.order('created_at', { ascending: sort === 'asc' });
        } else {
            query = query.order('created_at', { ascending: false });
        }

        if (limit) {
            query = query.range(offset || 0, (offset || 0) + parseInt(limit) - 1);
        }

        const { data: payments, count, error } = await query;

        if (error) {
            logger.error('Escrow transactions query error:', error);
            throw error;
        }

        // Return empty array if no payments exist yet
        return res.json(formatResponse(true, "Payments retrieved", {
            payments: payments || [],
            count: count || 0
        }));

    } catch (error) {
        logger.error('Get all payments error:', error);
        return res.status(500).json(formatResponse(false, 'Server error', null, error.message));
    }
};
