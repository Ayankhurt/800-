import { supabase } from '../config/supabaseClient.js';

export const supportController = {
    getAllTickets: async (req, res) => {
        try {
            const { page = 1, limit = 50, status, priority, category, search } = req.query;
            const from = (page - 1) * limit;
            const to = from + limit - 1;

            let query = supabase
                .from('support_tickets')
                .select('*', { count: 'exact' });

            // Filters
            if (status && status !== 'all') query = query.eq('status', status);
            if (priority && priority !== 'all') query = query.eq('priority', priority);
            if (category && category !== 'all') query = query.eq('category', category);

            // Search (Ticket Number)
            if (search) {
                query = query.ilike('ticket_number', `%${search}%`);
            }

            // Ordering
            query = query.order('created_at', { ascending: false }).range(from, to);

            const { data: tickets, count, error } = await query;

            if (error) {
                throw error;
            }

            // Fetch User Details Manually
            const userIds = [...new Set(tickets.map(t => t.user_id).filter(Boolean))];
            let usersMap = {};

            if (userIds.length > 0) {
                const { data: users, error: userError } = await supabase
                    .from('users')
                    .select('id, first_name, last_name, email')
                    .in('id', userIds);

                if (users) {
                    users.forEach(u => {
                        usersMap[u.id] = {
                            full_name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || 'Unknown User',
                            email: u.email
                        };
                    });
                }
            }

            // Enrich Data
            const enrichedTickets = tickets.map(t => ({
                ...t,
                user: usersMap[t.user_id] || { full_name: 'Unknown User', email: 'N/A' }
            }));

            res.status(200).json({
                success: true,
                data: {
                    tickets: enrichedTickets,
                    pagination: {
                        total: count,
                        page: parseInt(page),
                        limit: parseInt(limit),
                        totalPages: Math.ceil(count / limit)
                    }
                }
            });

        } catch (error) {
            console.error('Error fetching support tickets:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch tickets',
                error: error.message
            });
        }
    },

    getTicketById: async (req, res) => {
        try {
            const { id } = req.params;
            const { data: ticket, error } = await supabase
                .from('support_tickets')
                .select('*')
                .eq('id', id)
                .single();

            if (error || !ticket) {
                return res.status(404).json({ success: false, message: 'Ticket not found' });
            }

            // Fetch User
            const { data: user } = await supabase
                .from('users')
                .select('id, first_name, last_name, email')
                .eq('id', ticket.user_id)
                .single();

            const userData = user ? {
                full_name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
                email: user.email
            } : { full_name: 'Unknown', email: 'N/A' };

            // Fetch Messages (Conversation History)
            const { data: messages } = await supabase
                .from('support_ticket_messages')
                .select('*')
                .eq('ticket_id', id)
                .order('created_at', { ascending: true });

            // Transform messages for frontend
            const conversation_history = (messages || []).map(msg => {
                const isUser = msg.sender_id === ticket.user_id;
                return {
                    id: msg.id,
                    message: msg.message,
                    created_at: msg.created_at,
                    is_internal: msg.internal_only,
                    sender: isUser ? {
                        type: 'user',
                        user: userData
                    } : {
                        type: 'admin',
                        full_name: 'Support Agent'
                    }
                };
            });

            const enrichedTicket = {
                ...ticket,
                user: userData,
                conversation_history,
                internal_notes: conversation_history.filter(m => m.is_internal).map(m => ({
                    id: m.id,
                    note: m.message,
                    created_at: m.created_at,
                    created_by: {
                        full_name: m.sender.full_name || 'Support Agent'
                    }
                }))
            };

            res.status(200).json({
                success: true,
                data: enrichedTicket
            });

        } catch (error) {
            console.error('Error fetching ticket details:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    replyToTicket: async (req, res) => {
        try {
            const { id } = req.params;
            const { message, is_internal } = req.body;
            const sender_id = req.user.id; // From auth middleware

            if (!message) {
                return res.status(400).json({ success: false, message: 'Message is required' });
            }

            const { data: newMessage, error } = await supabase
                .from('support_ticket_messages')
                .insert({
                    ticket_id: id,
                    sender_id: sender_id,
                    message: message,
                    internal_only: is_internal || false
                })
                .select('*')
                .single();

            if (error) throw error;

            // Update ticket updated_at
            await supabase.from('support_tickets').update({ updated_at: new Date().toISOString() }).eq('id', id);

            res.status(200).json({ success: true, data: newMessage });
        } catch (error) {
            console.error('Error replying to ticket:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    addTicketNote: async (req, res) => {
        try {
            const { id } = req.params;
            const { note } = req.body;
            const sender_id = req.user.id;

            if (!note) {
                return res.status(400).json({ success: false, message: 'Note is required' });
            }

            const { data: newNote, error } = await supabase
                .from('support_ticket_messages')
                .insert({
                    ticket_id: id,
                    sender_id: sender_id,
                    message: note,
                    internal_only: true
                })
                .select('*')
                .single();

            if (error) throw error;

            res.status(200).json({ success: true, data: newNote });
        } catch (error) {
            console.error('Error adding note:', error);
            res.status(500).json({ success: false, message: error.message });
        }

    },

    updateTicket: async (req, res) => {
        try {
            const { id } = req.params;
            const updates = req.body; // status, priority, assigned_to, etc.

            // Filter allowed fields
            const allowedUpdates = {};
            if (updates.status) allowedUpdates.status = updates.status;
            if (updates.priority) allowedUpdates.priority = updates.priority;
            if (updates.assigned_to) allowedUpdates.assigned_to = updates.assigned_to;
            if (updates.category) allowedUpdates.category = updates.category;

            if (Object.keys(allowedUpdates).length === 0) {
                return res.json({ success: true, message: 'No valid updates provided' });
            }

            allowedUpdates.updated_at = new Date().toISOString();

            const { data: updatedTicket, error } = await supabase
                .from('support_tickets')
                .update(allowedUpdates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            res.status(200).json({ success: true, data: updatedTicket });
        } catch (error) {
            console.error('Error updating ticket:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    closeTicket: async (req, res) => {
        try {
            const { id } = req.params;
            const { resolution } = req.body;
            const userId = req.user.id;

            const { data: ticket, error } = await supabase
                .from('support_tickets')
                .update({
                    status: 'closed',
                    resolved_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            // Add resolution note if provided
            if (resolution) {
                await supabase.from('support_ticket_messages').insert({
                    ticket_id: id,
                    sender_id: userId,
                    message: `Ticket closed. Resolution: ${resolution}`,
                    internal_only: true
                });
            }

            res.status(200).json({ success: true, data: ticket });
        } catch (error) {
            console.error('Error closing ticket:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    reopenTicket: async (req, res) => {
        try {
            const { id } = req.params;
            const { reason } = req.body;
            const userId = req.user.id;

            const { data: ticket, error } = await supabase
                .from('support_tickets')
                .update({
                    status: 'open',
                    resolved_at: null,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            // Add reopening note
            if (reason) {
                await supabase.from('support_ticket_messages').insert({
                    ticket_id: id,
                    sender_id: userId,
                    message: `Ticket reopened. Reason: ${reason}`,
                    internal_only: true
                });
            }

            res.status(200).json({ success: true, data: ticket });
        } catch (error) {
            console.error('Error reopening ticket:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
};
