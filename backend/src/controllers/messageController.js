import { supabase } from "../config/supabaseClient.js";
import { formatResponse } from "../utils/formatResponse.js";
import { notificationService } from "../services/notificationService.js";

// Send Message with Real-Time Support
export const sendMessage = async (req, res) => {
    try {
        const senderId = req.user.id;
        const { receiver_id, content, conversation_id, attachment_url } = req.body;

        let convId = conversation_id;

        // If no conversation_id, create or find one
        if (!convId) {
            // Check if conversation exists between these users
            const { data: existingConv } = await supabase
                .from("conversation_participants")
                .select("conversation_id")
                .or(`user_id.eq.${senderId},user_id.eq.${receiver_id}`)
                .limit(2);

            if (existingConv && existingConv.length === 2) {
                // Conversation exists
                convId = existingConv[0].conversation_id;
            } else {
                // Create new conversation
                const { data: conv, error: convError } = await supabase
                    .from("conversations")
                    .insert({
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    })
                    .select()
                    .single();

                if (convError) throw convError;
                convId = conv.id;

                // Add participants
                await supabase.from("conversation_participants").insert([
                    { conversation_id: convId, user_id: senderId },
                    { conversation_id: convId, user_id: receiver_id }
                ]);
            }
        }

        // Insert message
        const { data, error } = await supabase
            .from("messages")
            .insert({
                conversation_id: convId,
                sender_id: senderId,
                content,
                attachment_url: attachment_url || null,
                is_read: false,
                created_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;

        // Update conversation's updated_at
        await supabase
            .from("conversations")
            .update({ updated_at: new Date().toISOString() })
            .eq("id", convId);

        // Create notification for receiver using service
        await notificationService.send(
            receiver_id,
            "New Message",
            `${req.user.first_name || 'Someone'} sent you a message: "${content.substring(0, 50)}${content.length > 50 ? '...' : ''}"`,
            "new_message",
            { conversation_id: convId }
        );

        return res.status(201).json(formatResponse(true, "Message sent", data));
    } catch (err) {
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};

// Get Conversations with Unread Count - SIMPLIFIED
export const getConversations = async (req, res) => {
    try {
        const userId = req.user.id;

        const { data, error } = await supabase
            .from("conversation_participants")
            .select(`conversation_id`)
            .eq("user_id", userId);

        if (error) throw error;

        // Get conversation details for each
        const conversationsWithDetails = await Promise.all(
            (data || []).map(async (conv) => {
                const convId = conv.conversation_id;

                // Get conversation
                const { data: conversation } = await supabase
                    .from("conversations")
                    .select("*")
                    .eq("id", convId)
                    .single();

                // Get last message
                const { data: lastMessage } = await supabase
                    .from("messages")
                    .select("content, created_at, sender_id")
                    .eq("conversation_id", convId)
                    .order("created_at", { ascending: false })
                    .limit(1)
                    .single();

                // Get unread count
                const { count: unreadCount } = await supabase
                    .from("messages")
                    .select("*", { count: "exact", head: true })
                    .eq("conversation_id", convId)
                    .eq("is_read", false)
                    .neq("sender_id", userId);

                // Get other participant
                const { data: participants } = await supabase
                    .from("conversation_participants")
                    .select("user_id")
                    .eq("conversation_id", convId)
                    .neq("user_id", userId)
                    .limit(1);

                let otherParticipant = null;
                if (participants && participants.length > 0) {
                    const { data: user } = await supabase
                        .from("users")
                        .select("id, first_name, last_name, avatar_url, company_name")
                        .eq("id", participants[0].user_id)
                        .single();
                    otherParticipant = user;
                }

                return {
                    ...conversation,
                    lastMessage,
                    unreadCount: unreadCount || 0,
                    otherParticipant
                };
            })
        );

        // Sort by updated_at manually
        conversationsWithDetails.sort((a, b) =>
            new Date(b.updated_at) - new Date(a.updated_at)
        );

        return res.json(formatResponse(true, "Conversations retrieved", conversationsWithDetails));
    } catch (err) {
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};

// Get Messages in a Conversation
export const getMessages = async (req, res) => {
    try {
        const userId = req.user.id;
        const { conversation_id } = req.params;
        const { page = 1, limit = 50 } = req.query;

        // Verify user is part of conversation
        const { data: participant } = await supabase
            .from("conversation_participants")
            .select("*")
            .eq("conversation_id", conversation_id)
            .eq("user_id", userId)
            .single();

        if (!participant) {
            return res.status(403).json(formatResponse(false, "Access denied", null));
        }

        const offset = (page - 1) * limit;

        const { data, count, error } = await supabase
            .from("messages")
            .select(`*`, { count: 'exact' })
            .eq("conversation_id", conversation_id)
            .order("created_at", { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) throw error;

        // Mark messages as read
        await supabase
            .from("messages")
            .update({ is_read: true })
            .eq("conversation_id", conversation_id)
            .eq("is_read", false)
            .neq("sender_id", userId);

        // Update last_read_at for this user
        await supabase
            .from("conversation_participants")
            .update({ last_read_at: new Date().toISOString() })
            .eq("conversation_id", conversation_id)
            .eq("user_id", userId);

        return res.json(formatResponse(true, "Messages retrieved", {
            messages: data,
            total: count,
            page: parseInt(page),
            pages: Math.ceil(count / limit)
        }));
    } catch (err) {
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};

// Mark Message as Read
export const markAsRead = async (req, res) => {
    try {
        const { message_id } = req.params;
        const userId = req.user.id;

        // Get message to verify conversation access
        const { data: message } = await supabase
            .from("messages")
            .select("conversation_id")
            .eq("id", message_id)
            .single();

        if (!message) {
            return res.status(404).json(formatResponse(false, "Message not found", null));
        }

        // Verify user is part of conversation
        const { data: participant } = await supabase
            .from("conversation_participants")
            .select("*")
            .eq("conversation_id", message.conversation_id)
            .eq("user_id", userId)
            .single();

        if (!participant) {
            return res.status(403).json(formatResponse(false, "Access denied", null));
        }

        const { error } = await supabase
            .from("messages")
            .update({ is_read: true })
            .eq("id", message_id);

        if (error) throw error;

        return res.json(formatResponse(true, "Message marked as read", null));
    } catch (err) {
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};

// Delete Message
export const deleteMessage = async (req, res) => {
    try {
        const { message_id } = req.params;
        const userId = req.user.id;

        // Verify sender
        const { data: message } = await supabase
            .from("messages")
            .select("sender_id")
            .eq("id", message_id)
            .single();

        if (!message) {
            return res.status(404).json(formatResponse(false, "Message not found", null));
        }

        if (message.sender_id !== userId) {
            return res.status(403).json(formatResponse(false, "Can only delete your own messages", null));
        }

        const { error } = await supabase
            .from("messages")
            .delete()
            .eq("id", message_id);

        if (error) throw error;

        return res.json(formatResponse(true, "Message deleted", null));
    } catch (err) {
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};
