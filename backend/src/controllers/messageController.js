import { supabase } from "../config/supabaseClient.js";
import { formatResponse } from "../utils/formatResponse.js";
import { notificationService } from "../services/notificationService.js";

// Send Message with Real-Time Support
export const sendMessage = async (req, res) => {
    console.log(`[DEBUG] sendMessage ENTERED. Body:`, JSON.stringify(req.body));
    try {
        const senderId = req.user.id;
        // Handle both snake_case and camelCase from frontend
        let receiver_id = req.body.receiver_id || req.body.receiverId;
        let content = req.body.content || req.body.message;
        let convId = req.body.conversation_id || req.body.conversationId;
        const attachment_url = req.body.attachment_url || req.body.attachmentUrl;
        const project_id = req.body.project_id || req.body.projectId;
        const job_id = req.body.job_id || req.body.jobId;

        if (!content) {
            return res.status(400).json(formatResponse(false, "Message content is required", null));
        }

        // If no conversation_id, create or find one
        if (!convId) {
            if (!receiver_id) {
                return res.status(400).json(formatResponse(false, "Receiver ID or Conversation ID is required", null));
            }

            console.log(`[DEBUG] Finding conversation between ${senderId} and ${receiver_id}`);

            // Find common conversation_id where both users are participants
            const { data: senderConvs } = await supabase
                .from('conversation_participants')
                .select('conversation_id')
                .eq('user_id', senderId);

            const { data: receiverConvs } = await supabase
                .from('conversation_participants')
                .select('conversation_id')
                .eq('user_id', receiver_id);

            const senderConvIds = (senderConvs || []).map(c => c.conversation_id);
            const receiverConvIds = (receiverConvs || []).map(c => c.conversation_id);

            const commonConvId = senderConvIds.find(id => receiverConvIds.includes(id));

            if (commonConvId) {
                console.log(`[DEBUG] Found existing conversation: ${commonConvId}`);
                convId = commonConvId;
            } else {
                console.log(`[DEBUG] Creating new conversation`);
                // Create new conversation
                const { data: conv, error: convError } = await supabase
                    .from("conversations")
                    .insert({
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                        project_id: project_id || null,
                        job_id: job_id || null
                    })
                    .select()
                    .single();

                if (convError) {
                    console.error("[DEBUG] Error creating conversation:", convError);
                    throw convError;
                }
                convId = conv.id;

                // Add participants
                await supabase.from("conversation_participants").insert([
                    { conversation_id: convId, user_id: senderId },
                    { conversation_id: convId, user_id: receiver_id }
                ]);
            }
        } else {
            // If conversation_id is provided, verify user is a participant
            console.log(`[DEBUG] Verifying participant for conversation ${convId}`);
            const { data: participant, error: partError } = await supabase
                .from("conversation_participants")
                .select("user_id")
                .eq("conversation_id", convId)
                .eq("user_id", senderId)
                .single();

            if (partError || !participant) {
                console.error(`[DEBUG] User ${senderId} is not a participant in conversation ${convId}`);
                return res.status(403).json(formatResponse(false, "Access denied - you are not a participant in this conversation", null));
            }

            if (!receiver_id) {
                // Look up the other participant
                console.log(`[DEBUG] Looking up receiver_id for conversation ${convId}`);
                const { data: participants } = await supabase
                    .from("conversation_participants")
                    .select("user_id")
                    .eq("conversation_id", convId)
                    .neq("user_id", senderId)
                    .limit(1);

                if (participants && participants.length > 0) {
                    receiver_id = participants[0].user_id;
                    console.log(`[DEBUG] Found receiver_id: ${receiver_id}`);
                } else {
                    console.warn(`[DEBUG] No other participant found in conversation ${convId}`);
                }
            }
        }

        // Process Attachments
        let attachments = req.body.attachments || [];
        if (req.body.attachment_url) {
            attachments.push({
                type: 'file',
                url: req.body.attachment_url,
                name: 'Attachment',
                created_at: new Date().toISOString()
            });
        }

        // Insert message - ACTUAL DB uses 'content' not 'message', and has no 'receiver_id property in the message table
        const messagePayload = {
            conversation_id: convId,
            sender_id: senderId,
            content: content,
            attachments: attachments,
            is_read: false,
            created_at: new Date().toISOString()
        };

        console.log(`[DEBUG] Inserting message into conversation ${convId}. Payload sample:`, {
            conversation_id: convId,
            sender_id: senderId,
            content: typeof content === 'string' ? content.substring(0, 20) : 'not a string',
            attachmentCount: attachments.length
        });

        const { data, error: insertError } = await supabase
            .from("messages")
            .insert(messagePayload)
            .select()
            .single();

        if (insertError) {
            console.error("[DEBUG] Message insert error:", {
                code: insertError.code,
                message: insertError.message,
                details: insertError.details,
                hint: insertError.hint
            });
            throw insertError;
        }

        const msgContent = typeof content === 'string' ? content : String(content);

        // Update conversation's updated_at (last_message_at does not exist)
        console.log(`[DEBUG] Updating conversation ${convId} timestamp`);
        await supabase
            .from("conversations")
            .update({
                updated_at: new Date().toISOString()
            })
            .eq("id", convId);

        // Create notification for receiver using service
        if (receiver_id) {
            console.log(`[DEBUG] Sending notification to ${receiver_id}`);
            try {
                await notificationService.send(
                    receiver_id,
                    "New Message",
                    `${req.user.first_name || 'Someone'} sent you a message: "${msgContent.substring(0, 50)}${msgContent.length > 50 ? '...' : ''}"`,
                    "info",
                    { conversation_id: convId }
                );
            } catch (notifWarn) {
                console.warn("[DEBUG] Notification failed but message sent:", notifWarn);
            }
        }

        return res.status(201).json(formatResponse(true, "Message sent", data));
    } catch (err) {
        console.error("[DEBUG] sendMessage Global Error:", {
            message: err.message,
            stack: err.stack,
            code: err.code,
            details: err.details
        });
        return res.status(500).json(formatResponse(false, err.message || "Internal Server Error", {
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        }));
    }
};

// Create or Get Conversation
export const createConversation = async (req, res) => {
    try {
        const senderId = req.user.id;
        const { userId, receiver_id, job_id, jobId, project_id, projectId } = req.body;

        const final_receiver_id = userId || receiver_id || req.body.recipient_id;
        const final_job_id = job_id || jobId || null;
        const final_project_id = project_id || projectId || null;

        if (!final_receiver_id) {
            return res.status(400).json(formatResponse(false, "Receiver User ID is required", null));
        }

        console.log(`[DEBUG] createConversation: Sender=${senderId}, Receiver=${final_receiver_id}`);

        // Find common conversation_id where both users are participants
        const { data: senderConvs } = await supabase
            .from('conversation_participants')
            .select('conversation_id')
            .eq('user_id', senderId);

        const { data: receiverConvs } = await supabase
            .from('conversation_participants')
            .select('conversation_id')
            .eq('user_id', final_receiver_id);

        const senderConvIds = (senderConvs || []).map(c => c.conversation_id);
        const receiverConvIds = (receiverConvs || []).map(c => c.conversation_id);

        const commonConvId = senderConvIds.find(id => receiverConvIds.includes(id));

        let conv;
        if (commonConvId) {
            console.log(`[DEBUG] Found existing conversation: ${commonConvId}`);
            const { data: existing } = await supabase
                .from("conversations")
                .select("*")
                .eq("id", commonConvId)
                .single();
            conv = existing;

            // Optionally update job/project if provided and not set
            if ((final_job_id && !conv.job_id) || (final_project_id && !conv.project_id)) {
                await supabase.from("conversations").update({
                    job_id: conv.job_id || final_job_id,
                    project_id: conv.project_id || final_project_id
                }).eq("id", commonConvId);
            }
        } else {
            console.log(`[DEBUG] Creating new conversation`);
            const { data: newConv, error: convError } = await supabase
                .from("conversations")
                .insert({
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    project_id: final_project_id,
                    job_id: final_job_id
                })
                .select()
                .single();

            if (convError) throw convError;
            conv = newConv;

            console.log(`[DEBUG] Created conversation ${conv.id}, now adding participants`);
            // Add participants
            const { data: participants, error: partError } = await supabase
                .from("conversation_participants")
                .insert([
                    { conversation_id: conv.id, user_id: senderId },
                    { conversation_id: conv.id, user_id: final_receiver_id }
                ])
                .select();

            if (partError) {
                console.error(`[DEBUG] Failed to add participants:`, partError);
                throw partError;
            }

            console.log(`[DEBUG] Added ${participants?.length || 0} participants to conversation ${conv.id}`);
        }

        return res.status(201).json(formatResponse(true, "Conversation created/retrieved", conv));
    } catch (err) {
        console.error("[DEBUG] createConversation Error:", err);
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

                // Get last message - Use 'content' column from actual DB
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

        console.log(`[DEBUG] getMessages: userId=${userId}, conversationId=${conversation_id}`);

        // First check if conversation exists
        const { data: conversation, error: convError } = await supabase
            .from("conversations")
            .select("id")
            .eq("id", conversation_id)
            .single();

        if (convError || !conversation) {
            console.log(`[DEBUG] Conversation not found: ${conversation_id}`);
            return res.status(404).json(formatResponse(false, "Conversation not found", null));
        }

        // Verify user is part of conversation
        const { data: participant, error: partError } = await supabase
            .from("conversation_participants")
            .select("*")
            .eq("conversation_id", conversation_id)
            .eq("user_id", userId)
            .single();

        console.log(`[DEBUG] Participant check: found=${!!participant}, error=${partError?.message}`);

        if (!participant) {
            // Get all participants for debugging
            const { data: allParticipants } = await supabase
                .from("conversation_participants")
                .select("user_id")
                .eq("conversation_id", conversation_id);

            console.log(`[DEBUG] User ${userId} not in conversation. Participants:`, allParticipants?.map(p => p.user_id));
            return res.status(403).json(formatResponse(false, "Access denied - you are not a participant in this conversation", null));
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
        const { message_id, conversation_id } = req.params;
        const userId = req.user.id;

        if (conversation_id) {
            // Bulk mark as read for whole conversation
            const { error } = await supabase
                .from("messages")
                .update({ is_read: true }) // 'read' column does not exist
                .eq("conversation_id", conversation_id)
                .neq("sender_id", userId)
                .eq("is_read", false);

            if (error) throw error;

            // Update participant last_read_at
            await supabase
                .from("conversation_participants")
                .update({ last_read_at: new Date().toISOString() })
                .eq("conversation_id", conversation_id)
                .eq("user_id", userId);

            return res.json(formatResponse(true, "Conversation marked as read", null));
        }

        if (message_id) {
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
                .update({ is_read: true }) // 'read' column does not exist
                .eq("id", message_id);

            if (error) throw error;

            return res.json(formatResponse(true, "Message marked as read", null));
        }

        return res.status(400).json(formatResponse(false, "Message ID or Conversation ID is required", null));
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

// Get Unread Count
export const getUnreadCount = async (req, res) => {
    try {
        const userId = req.user.id;

        // Count messages in conversations where user is a participant, but user is not the sender
        const { data: userConvs } = await supabase
            .from("conversation_participants")
            .select("conversation_id")
            .eq("user_id", userId);

        const convIds = (userConvs || []).map(c => c.conversation_id);

        const { count, error } = await supabase
            .from("messages")
            .select('*', { count: 'exact', head: true })
            .in("conversation_id", convIds)
            .neq("sender_id", userId)
            .eq("is_read", false);

        if (error) throw error;

        return res.json(formatResponse(true, "Unread count retrieved", { count: count || 0 }));
    } catch (err) {
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};
