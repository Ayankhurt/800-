import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import {
  MessageCircle,
  Send,
  Search,
  Clock,
  X,
} from "lucide-react-native";

const staticColors = {
  primary: "#2563EB",
  secondary: "#F97316",
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
  white: "#FFFFFF",
  black: "#000000",
  background: "#F8FAFC",
  surface: "#FFFFFF",
  text: "#0F172A",
  textSecondary: "#64748B",
  textTertiary: "#94A3B8",
  border: "#E2E8F0",
  info: "#3B82F6",
  primaryLight: "#EFF6FF",
};
import { useAuth } from "@/contexts/AuthContext";
import { useJobs } from "@/contexts/JobsContext";
import { conversationsAPI, messagesAPI } from "@/services/api";

type ConversationPreview = {
  id: string;
  otherUserId: string;
  otherUserName: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  jobTitle?: string;
};

export default function MessagesScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { user, colors } = useAuth();
  const { messages: contextMessages, getJobById, sendMessage: contextSendMessage, markMessageAsRead: contextMarkMessageAsRead } = useJobs();
  const [apiConversations, setApiConversations] = useState<any[]>([]);
  const [apiMessages, setApiMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [isMessagesLoading, setIsMessagesLoading] = useState(false);
  const [isSilentRefreshing, setIsSilentRefreshing] = useState(false);

  // Fetch conversations from API
  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedConversationId) {
      fetchMessages(selectedConversationId);
    }
  }, [selectedConversationId]);

  // Background Fetcher Polling
  useEffect(() => {
    if (!user) return;

    // Refresh every 5 seconds silently
    const interval = setInterval(() => {
      fetchConversations(true);
      if (selectedConversationId) {
        fetchMessages(selectedConversationId, true);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [user, selectedConversationId]);

  const fetchConversations = async (silent = false) => {
    if (!user) return;

    try {
      if (!silent) setIsLoading(true);
      if (silent) setIsSilentRefreshing(true);
      console.log("[API] GET /conversations", silent ? '(silent)' : '');
      const response = await conversationsAPI.getAll();

      if (response.success && response.data) {
        const mappedConversations = Array.isArray(response.data) ? response.data.map((conv: any) => ({
          id: conv.id || conv.conversation_id,
          otherUserId: conv.otherParticipant?.id || conv.other_user_id || conv.otherUserId,
          otherUserName: conv.otherParticipant ?
            `${conv.otherParticipant.first_name || ''} ${conv.otherParticipant.last_name || ''}`.trim() || conv.otherParticipant.company_name
            : conv.other_user_name || conv.otherUserName || "Unknown",
          lastMessage: conv.lastMessage?.content || conv.last_message || conv.lastMessage || "",
          lastMessageTime: conv.lastMessage?.created_at || conv.last_message_time || conv.lastMessageTime || new Date().toISOString(),
          unreadCount: conv.unreadCount || conv.unread_count || 0,
          jobTitle: conv.jobTitle || conv.job_title,
        })) : [];

        setApiConversations(mappedConversations);
      }
    } catch (error: any) {
      console.error("[API] Failed to fetch conversations:", error);
    } finally {
      if (!silent) setIsLoading(false);
      setIsSilentRefreshing(false);
    }
  };

  const fetchMessages = async (conversationId: string, silent = false) => {
    try {
      if (!silent) setIsMessagesLoading(true);
      if (silent) setIsSilentRefreshing(true);
      console.log("[API] GET /messages/conversations/:conversationId", conversationId, silent ? '(silent)' : '');
      const response = await messagesAPI.getByConversation(conversationId);

      if (response.success && response.data) {
        const messagesArray = response.data.messages || response.data;
        const mappedMessages = Array.isArray(messagesArray) ? messagesArray.map((msg: any) => ({
          id: msg.id || msg.message_id,
          senderId: msg.sender_id || msg.senderId,
          senderName: msg.sender_name || msg.senderName,
          receiverId: msg.receiver_id || msg.receiverId,
          message: msg.message || msg.content || msg.body,
          sentAt: msg.sent_at || msg.sentAt || msg.created_at || msg.createdAt,
          read: msg.read || msg.is_read || false,
          jobId: msg.job_id || msg.jobId,
          applicationId: msg.application_id || msg.applicationId,
        })) : [];

        setApiMessages(mappedMessages);
      }
    } catch (error: any) {
      console.error("[API] Failed to fetch messages:", error);
    } finally {
      if (!silent) setIsMessagesLoading(false);
      setIsSilentRefreshing(false);
    }
  };


  const onRefresh = async () => {
    setRefreshing(true);
    await fetchConversations();
    if (selectedConversationId) {
      await fetchMessages(selectedConversationId);
    }
    setRefreshing(false);
  };

  // Build context-based conversations (always called to maintain hook order)
  const contextConversations = useMemo(() => {
    if (!user) return [];

    const conversationMap = new Map<string, ConversationPreview>();

    contextMessages.forEach((msg) => {
      const isReceiver = msg.receiverId === user.id;
      const isSender = msg.senderId === user.id;

      if (!isReceiver && !isSender) return;

      const otherUserId = isReceiver ? msg.senderId : msg.receiverId;
      const key = [user.id, otherUserId].sort().join("-");

      const existing = conversationMap.get(key);
      const isNewer = !existing ||
        new Date(msg.sentAt) > new Date(existing.lastMessageTime);

      if (isNewer || !existing) {
        const job = getJobById(msg.jobId);
        conversationMap.set(key, {
          id: key,
          otherUserId,
          otherUserName: isReceiver ? msg.senderName : "You",
          lastMessage: msg.message,
          lastMessageTime: msg.sentAt,
          unreadCount: isReceiver && !msg.read ?
            (existing?.unreadCount || 0) + 1 :
            (existing?.unreadCount || 0),
          jobTitle: job?.title,
        });
      }
    });

    return Array.from(conversationMap.values())
      .sort((a, b) =>
        new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
      );
  }, [contextMessages, user, getJobById]);

  // Use API conversations if available, otherwise fallback to context
  const conversations = apiConversations.length > 0 ? apiConversations.map(conv => ({
    id: conv.id,
    otherUserId: conv.otherUserId,
    otherUserName: conv.otherUserName,
    lastMessage: conv.lastMessage,
    lastMessageTime: conv.lastMessageTime,
    unreadCount: conv.unreadCount,
    jobTitle: conv.jobTitle,
  })) : contextConversations;

  const filteredConversations = useMemo(() => {
    return conversations.filter((conv) =>
      conv.otherUserName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.jobTitle?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [conversations, searchQuery]);

  const selectedMessages = useMemo(() => {
    console.log("[DEBUG] selectedMessages - conversationId:", selectedConversationId, "conversation:", selectedConversation);
    console.log("[DEBUG] selectedMessages - apiMessages count:", apiMessages.length);

    if (!selectedConversationId && !selectedConversation) return [];
    if (!user) return [];

    // If we have a selectedConversationId (API conversation), use API messages
    if (selectedConversationId) {
      console.log("[DEBUG] Using API messages for conversation:", selectedConversationId);
      const sorted = apiMessages.sort((a, b) =>
        new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()
      );
      console.log("[DEBUG] Returning", sorted.length, "API messages");
      return sorted;
    }

    // Otherwise fallback to context messages
    if (!selectedConversation) return [];
    const [userId1, userId2] = selectedConversation.split("-");
    const otherUserId = userId1 === user.id ? userId2 : userId1;

    const filtered = contextMessages
      .filter(
        (msg) =>
          (msg.senderId === user.id && msg.receiverId === otherUserId) ||
          (msg.receiverId === user.id && msg.senderId === otherUserId)
      )
      .sort((a, b) =>
        new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()
      );

    console.log("[DEBUG] Returning", filtered.length, "context messages");
    return filtered;
  }, [apiMessages, contextMessages, selectedConversation, selectedConversationId, user]);

  const handleSendMessage = useCallback(async () => {
    if (!newMessage.trim() || !user) return;
    if (!selectedConversationId && !selectedConversation) return;

    setSending(true);
    try {
      // If we have a conversation ID, use it
      if (selectedConversationId) {
        console.log("[API] POST /messages", { conversationId: selectedConversationId, message: newMessage });
        const response = await messagesAPI.send({
          conversationId: selectedConversationId,
          content: newMessage,
        });

        console.log("[DEBUG] Send message response:", response);

        if (response.success) {
          setNewMessage("");
          // Refresh messages
          console.log("[DEBUG] Message sent successfully, refreshing messages...");
          await fetchMessages(selectedConversationId);
        } else {
          console.error("[DEBUG] Failed to send message:", response.message);
          Alert.alert("Error", response.message || "Failed to send message");
        }
      } else if (selectedConversation) {
        // Fallback to context for old conversation format
        const [userId1, userId2] = selectedConversation.split("-");
        const otherUserId = userId1 === user.id ? userId2 : userId1;
        const lastMsg = selectedMessages[selectedMessages.length - 1];

        // Try to get or create conversation
        try {
          console.log("[API] POST /conversations", { userId: otherUserId });
          const convResponse = await conversationsAPI.create({
            userId: otherUserId,
            jobId: lastMsg?.jobId,
          });

          if (convResponse.success && convResponse.data) {
            const convId = convResponse.data.id || convResponse.data.conversation_id;
            setSelectedConversationId(convId);

            // Send message
            const msgResponse = await messagesAPI.send({
              conversationId: convId,
              content: newMessage,
            });

            if (msgResponse.success) {
              setNewMessage("");
              await fetchMessages(convId);
            }
          }
        } catch (error: any) {
          console.error("[API] Failed to create conversation or send message:", error);
          // Fallback to context
          await contextSendMessage(
            lastMsg?.jobId || "",
            otherUserId,
            newMessage,
            lastMsg?.applicationId
          );
          setNewMessage("");
        }
      }
    } catch (error: any) {
      console.error("[API] Failed to send message:", error);
      Alert.alert("Error", "Failed to send message. Please try again.");
    } finally {
      setSending(false);
    }
  }, [newMessage, selectedConversation, selectedConversationId, user, selectedMessages, contextSendMessage]);

  const handleSelectConversation = useCallback(async (conversationId: string) => {
    console.log("[DEBUG] Selecting conversation:", conversationId);
    // Check if it's an API conversation ID or old format
    const apiConv = apiConversations.find(c => c.id === conversationId);
    if (apiConv) {
      setSelectedConversationId(conversationId);
      setSelectedConversation(null);
      // Fetch messages for this conversation
      fetchMessages(conversationId);
    } else {
      // Legacy format: "userId1-userId2"
      console.log("[DEBUG] Legacy conversation detected, creating API conversation");
      setSelectedConversation(conversationId);
      setSelectedConversationId(null);

      // Try to create/get API conversation for this legacy format
      if (user) {
        try {
          const [userId1, userId2] = conversationId.split("-");
          const otherUserId = userId1 === user.id ? userId2 : userId1;

          console.log("[API] POST /conversations (legacy migration)", { userId: otherUserId });
          const convResponse = await conversationsAPI.create({
            userId: otherUserId,
          });

          if (convResponse.success && convResponse.data) {
            const newConvId = convResponse.data.id || convResponse.data.conversation_id;
            console.log("[DEBUG] Migrated legacy conversation to API:", newConvId);
            setSelectedConversationId(newConvId);
            setSelectedConversation(null);
            fetchMessages(newConvId);
          }
        } catch (error) {
          console.error("[DEBUG] Failed to migrate legacy conversation:", error);
          // Keep using legacy format
        }
      }
    }
  }, [apiConversations, user]);

  useEffect(() => {
    if ((selectedConversationId || selectedConversation) && user) {
      const unreadMessages = selectedMessages.filter(
        (msg) => msg.receiverId === user.id && !msg.read
      );
      unreadMessages.forEach(async (msg) => {
        try {
          console.log("[API] PATCH /messages/:id/read", msg.id);
          await messagesAPI.markMessageAsRead(msg.id);
          // Update local state
          setApiMessages(prev => prev.map(m =>
            m.id === msg.id ? { ...m, read: true } : m
          ));
        } catch (error: any) {
          console.error("[API] Failed to mark message as read:", error);
          // Fallback to context
          contextMarkMessageAsRead(msg.id);
        }
      });
    }
  }, [selectedConversation, selectedConversationId, selectedMessages, user, contextMarkMessageAsRead]);

  useEffect(() => {
    if (params.userId && user) {
      const userId = Array.isArray(params.userId) ? params.userId[0] : params.userId;
      const conversationId = [user.id, userId].sort().join("-");
      const conversation = conversations.find(c => c.id === conversationId);

      if (conversation) {
        handleSelectConversation(conversationId);
      } else {
        // Create conversation if it doesn't exist
        handleSelectConversation(conversationId);
      }
    }
  }, [params.userId, user, conversations, handleSelectConversation]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: "Messages",
          headerStyle: {
            backgroundColor: colors.surface,
          },
          headerTitleStyle: {
            color: colors.text,
            fontWeight: "700" as const,
          },
        }}
      />



      <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Search size={20} color={colors.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search messages..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={colors.textTertiary}
        />
      </View>

      <FlatList
        data={filteredConversations}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.conversationCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
              item.unreadCount > 0 && [styles.conversationUnread, { borderColor: colors.primary }],
            ]}
            onPress={() => handleSelectConversation(item.id)}
          >
            <View style={styles.avatarContainer}>
              <Text style={[styles.avatarText, { backgroundColor: colors.primary + "20", color: colors.primary }]}>
                {item.otherUserName
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")}
              </Text>
              {item.unreadCount > 0 && (
                <View style={[styles.unreadBadge, { backgroundColor: colors.error }]}>
                  <Text style={[styles.unreadBadgeText, { color: colors.white }]}>{item.unreadCount}</Text>
                </View>
              )}
            </View>

            <View style={styles.conversationContent}>
              <View style={styles.conversationHeader}>
                <Text style={[styles.conversationName, { color: colors.text }]} numberOfLines={1}>
                  {item.otherUserName}
                </Text>
                <View style={styles.timeContainer}>
                  <Clock size={12} color={colors.textTertiary} />
                  <Text style={[styles.conversationTime, { color: colors.textTertiary }]}>
                    {formatTime(item.lastMessageTime)}
                  </Text>
                </View>
              </View>
              {item.jobTitle && (
                <Text style={[styles.jobTitle, { color: colors.primary }]} numberOfLines={1}>
                  {item.jobTitle}
                </Text>
              )}
              <Text
                style={[
                  styles.lastMessage,
                  { color: colors.textSecondary },
                  item.unreadCount > 0 && [styles.lastMessageUnread, { color: colors.text }],
                ]}
                numberOfLines={1}
              >
                {item.lastMessage}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.emptyState}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>Loading conversations...</Text>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <MessageCircle size={48} color={colors.textTertiary} />
              <Text style={[styles.emptyStateTitle, { color: colors.text }]}>No Messages</Text>
              <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                Your conversations will appear here
              </Text>
            </View>
          )
        }
      />

      <Modal
        visible={selectedConversation !== null || selectedConversationId !== null}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        {(selectedConversation || selectedConversationId) && (
          <KeyboardAvoidingView
            style={[styles.chatContainer, { backgroundColor: colors.background }]}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 20}
          >
            <View style={[styles.chatHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
              <Text style={[styles.chatTitle, { color: colors.text }]}>
                {(() => {
                  // First check for API conversation
                  if (selectedConversationId) {
                    const conv = conversations.find((c) => c.id === selectedConversationId);
                    if (conv) return conv.otherUserName;
                  }

                  // Then check for legacy conversation
                  if (selectedConversation) {
                    const conv = conversations.find((c) => c.id === selectedConversation);
                    if (conv) return conv.otherUserName;

                    // Parse legacy format
                    const [userId1, userId2] = selectedConversation.split("-");
                    const otherUserId = userId1 === user?.id ? userId2 : userId1;
                    const legacyConv = conversations.find(c => c.id === selectedConversation);
                    return legacyConv?.otherUserName || "User";
                  }

                  return "Chat";
                })()}
              </Text>
              <TouchableOpacity onPress={() => {
                setSelectedConversation(null);
                setSelectedConversationId(null);
                if (params.userId) {
                  router.back();
                }
              }}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.messagesScroll}
              contentContainerStyle={styles.messagesContent}
            >
              {isMessagesLoading ? (
                <View style={styles.emptyState}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>Loading messages...</Text>
                </View>
              ) : selectedMessages.length === 0 ? (
                <View style={styles.emptyState}>
                  <MessageCircle size={48} color={colors.textTertiary} />
                  <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                    No messages yet. Start the conversation!
                  </Text>
                </View>
              ) : (
                selectedMessages.map((msg) => {
                  const isMine = msg.senderId === user?.id;
                  return (
                    <View
                      key={`${msg.id}-${isMine ? 'sent' : 'received'}`}
                      style={[
                        styles.messageContainer,
                        isMine
                          ? styles.messageContainerSent
                          : styles.messageContainerReceived,
                      ]}
                    >
                      <View
                        style={[
                          styles.messageBubble,
                          isMine
                            ? [styles.messageBubbleSent, { backgroundColor: colors.primary }]
                            : [styles.messageBubbleReceived, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }],
                        ]}
                      >
                        <Text
                          style={[
                            styles.messageText,
                            { color: isMine ? colors.white : colors.text },
                            isMine && styles.messageTextSent,
                          ]}
                        >
                          {msg.message}
                        </Text>
                        <Text style={[styles.messageTime, { color: isMine ? colors.white + "80" : colors.textTertiary }]}>
                          {new Date(msg.sentAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </Text>
                      </View>
                    </View>
                  );
                })
              )}
            </ScrollView>

            <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
              <TextInput
                style={[styles.messageInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                placeholder="Type a message..."
                value={newMessage}
                onChangeText={setNewMessage}
                placeholderTextColor={colors.textTertiary}
                multiline
                maxLength={500}
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  { backgroundColor: colors.primary },
                  (!newMessage.trim() || sending) && styles.sendButtonDisabled,
                ]}
                onPress={handleSendMessage}
                disabled={!newMessage.trim() || sending}
              >
                <Send size={20} color={colors.white} />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        )}
      </Modal>
    </View>
  );
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: staticColors.background,
  },
  searchContainer: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    backgroundColor: staticColors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    margin: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: staticColors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: staticColors.text,
  },
  listContent: {
    paddingHorizontal: 16,
  },
  conversationCard: {
    flexDirection: "row" as const,
    backgroundColor: staticColors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: staticColors.border,
  },
  conversationUnread: {
    borderColor: staticColors.primary,
    borderWidth: 2,
  },
  avatarContainer: {
    position: "relative" as const,
    marginRight: 12,
  },
  avatarText: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: staticColors.primary + "20",
    textAlign: "center" as const,
    lineHeight: 50,
    fontSize: 18,
    fontWeight: "700" as const,
    color: staticColors.primary,
  },
  unreadBadge: {
    position: "absolute" as const,
    top: -4,
    right: -4,
    backgroundColor: staticColors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    paddingHorizontal: 6,
  },
  unreadBadgeText: {
    fontSize: 11,
    fontWeight: "700" as const,
    color: staticColors.white,
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    marginBottom: 4,
  },
  conversationName: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600" as const,
    color: staticColors.text,
    marginRight: 8,
  },
  timeContainer: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 4,
  },
  conversationTime: {
    fontSize: 12,
    color: staticColors.textTertiary,
  },
  jobTitle: {
    fontSize: 13,
    color: staticColors.primary,
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 14,
    color: staticColors.textSecondary,
  },
  lastMessageUnread: {
    fontWeight: "600" as const,
    color: staticColors.text,
  },
  emptyState: {
    alignItems: "center" as const,
    justifyContent: "center" as const,
    paddingVertical: 64,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: staticColors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: staticColors.textSecondary,
  },
  chatContainer: {
    flex: 1,
    backgroundColor: staticColors.background,
  },
  chatHeader: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: staticColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: staticColors.border,
  },
  chatTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: staticColors.text,
  },
  messagesScroll: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  messageContainer: {
    marginBottom: 12,
    flexDirection: "row" as const,
    width: "100%",
  },
  messageContainerSent: {
    alignItems: "flex-end" as const,
    justifyContent: "flex-end" as const,
  },
  messageContainerReceived: {
    alignItems: "flex-start" as const,
    justifyContent: "flex-start" as const,
  },
  messageBubble: {
    maxWidth: "75%",
    borderRadius: 16,
    padding: 12,
  },
  messageBubbleSent: {
    backgroundColor: staticColors.primary,
    borderBottomRightRadius: 4,
  },
  messageBubbleReceived: {
    backgroundColor: staticColors.surface,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    color: staticColors.text,
    marginBottom: 4,
  },
  messageTextSent: {
    color: staticColors.white,
  },
  messageTime: {
    fontSize: 11,
    color: staticColors.textTertiary,
  },
  inputContainer: {
    flexDirection: "row" as const,
    padding: 16,
    paddingBottom: Platform.OS === "ios" ? 16 : 16,
    backgroundColor: staticColors.surface,
    borderTopWidth: 1,
    borderTopColor: staticColors.border,
    gap: 12,
  },
  messageInput: {
    flex: 1,
    backgroundColor: staticColors.background,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: staticColors.text,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: staticColors.primary,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
