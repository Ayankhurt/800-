import { supabase } from "../config/supabaseClient.js";
import { formatResponse } from "../utils/formatResponse.js";

// ==========================================
// CONVERSATIONS
// ==========================================

export const getConversations = async (req, res) => {
    try {
        const userId = req.user.id;

        // Get conversations where user is a participant
        // Note: Supabase join syntax for many-to-many is tricky, simplifying by assuming direct columns or separate query
        // The schema has `conversation_participants` table.

        const { data: participations, error: partError } = await supabase
            .from("conversation_participants")
            .select("conversation_id")
            .eq("user_id", userId);

        if (partError) throw partError;

        const conversationIds = participations.map(p => p.conversation_id);

        if (conversationIds.length === 0) {
            return res.json(formatResponse(true, "Conversations retrieved", []));
        }

        const { data, error } = await supabase
            .from("conversations")
            .select(`
                *,
                participants:conversation_participants(
                    user:users(id, first_name, last_name, avatar_url)
                ),
                last_message:messages(message, created_at, is_read, sender_id)
            `)
            .in("id", conversationIds)
            .order("last_message_at", { ascending: false });

        if (error) throw error;

        // Process data to be cleaner for frontend
        const processed = data.map(conv => ({
            ...conv,
            other_participants: conv.participants.filter(p => p.user.id !== userId).map(p => p.user),
            last_message: conv.last_message?.[0] || null // Assuming limit 1 logic or just taking first
        }));

        return res.json(formatResponse(true, "Conversations retrieved", processed));
    } catch (err) {
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};

export const createConversation = async (req, res) => {
    try {
        const userId = req.user.id;
        const { recipient_id, project_id, subject } = req.body;

        // Create conversation
        const { data: conversation, error: convError } = await supabase
            .from("conversations")
            .insert({
                created_by: userId,
                project_id,
                subject,
                last_message_at: new Date()
            })
            .select()
            .single();

        if (convError) throw convError;

        // Add participants
        const participants = [
            { conversation_id: conversation.id, user_id: userId },
            { conversation_id: conversation.id, user_id: recipient_id }
        ];

        const { error: partError } = await supabase
            .from("conversation_participants")
            .insert(participants);

        if (partError) throw partError;

        return res.status(201).json(formatResponse(true, "Conversation started", conversation));
    } catch (err) {
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};

// ==========================================
// MESSAGES
// ==========================================

export const getMessages = async (req, res) => {
    try {
        const userId = req.user.id;
        const { conversation_id } = req.params;

        // Verify participation
        const { data: participation } = await supabase
            .from("conversation_participants")
            .select("user_id")
            .eq("conversation_id", conversation_id)
            .eq("user_id", userId)
            .single();

        if (!participation) return res.status(403).json(formatResponse(false, "Unauthorized", null));

        const { data, error } = await supabase
            .from("messages")
            .select("*")
            .eq("conversation_id", conversation_id)
            .order("created_at", { ascending: true });

        if (error) throw error;

        // Manual Join for Senders
        let enrichedMessages = [];
        if (data && data.length > 0) {
            const senderIds = [...new Set(data.map(m => m.sender_id))];

            const { data: senders } = await supabase
                .from("users")
                .select("id, first_name, last_name, avatar_url")
                .in("id", senderIds);

            const senderMap = {};
            if (senders) {
                senders.forEach(s => senderMap[s.id] = s);
            }

            enrichedMessages = data.map(m => ({
                ...m,
                sender: senderMap[m.sender_id] || null
            }));
        }

        return res.json(formatResponse(true, "Messages retrieved", enrichedMessages));
    } catch (err) {
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};

export const sendMessage = async (req, res) => {
    try {
        const userId = req.user.id;
        const { conversation_id } = req.params;
        const { message, project_id } = req.body;

        // Verify participation
        const { data: participation } = await supabase
            .from("conversation_participants")
            .select("user_id")
            .eq("conversation_id", conversation_id)
            .eq("user_id", userId)
            .single();

        if (!participation) return res.status(403).json(formatResponse(false, "Unauthorized", null));

        // Insert message
        const { data, error } = await supabase
            .from("messages")
            .insert({
                conversation_id,
                sender_id: userId,
                message,
                project_id, // Optional linkage
                is_read: false
            })
            .select()
            .single();

        if (error) throw error;

        // Update conversation timestamp
        await supabase
            .from("conversations")
            .update({ last_message_at: new Date() })
            .eq("id", conversation_id);

        return res.status(201).json(formatResponse(true, "Message sent", data));
    } catch (err) {
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};

export const markMessagesRead = async (req, res) => {
    try {
        const userId = req.user.id;
        const { conversation_id } = req.params;

        // Update all unread messages in this conversation sent by others
        const { error } = await supabase
            .from("messages")
            .update({ is_read: true, read: true })
            .eq("conversation_id", conversation_id)
            .neq("sender_id", userId)
            .eq("is_read", false);

        if (error) throw error;

        // Update participant last_read_at
        await supabase
            .from("conversation_participants")
            .update({ last_read_at: new Date() })
            .eq("conversation_id", conversation_id)
            .eq("user_id", userId);

        return res.json(formatResponse(true, "Messages marked as read", null));
    } catch (err) {
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};
