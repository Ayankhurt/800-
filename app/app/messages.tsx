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
import Colors from "@/constants/colors";
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
  const { user } = useAuth();
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

  // Fetch conversations from API
  useEffect(() => {
    fetchConversations();
  }, []);

  // Fetch messages when conversation is selected
  useEffect(() => {
    if (selectedConversationId) {
      fetchMessages(selectedConversationId);
    }
  }, [selectedConversationId]);

  const fetchConversations = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      console.log("[API] GET /conversations");
      const response = await conversationsAPI.getAll();
      
      if (response.success && response.data) {
        const mappedConversations = Array.isArray(response.data) ? response.data.map((conv: any) => ({
          id: conv.id || conv.conversation_id,
          otherUserId: conv.other_user_id || conv.otherUserId,
          otherUserName: conv.other_user_name || conv.otherUserName || "Unknown",
          lastMessage: conv.last_message || conv.lastMessage || "",
          lastMessageTime: conv.last_message_time || conv.lastMessageTime || new Date().toISOString(),
          unreadCount: conv.unread_count || conv.unreadCount || 0,
          jobTitle: conv.job_title || conv.jobTitle,
        })) : [];
        setApiConversations(mappedConversations);
      }
    } catch (error: any) {
      console.error("[API] Failed to fetch conversations:", error);
      // Fallback to context
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      console.log("[API] GET /messages/conversations/:conversationId", conversationId);
      const response = await messagesAPI.getByConversation(conversationId);
      
      if (response.success && response.data) {
        const mappedMessages = Array.isArray(response.data) ? response.data.map((msg: any) => ({
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
      // Fallback to context messages
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

  // Use API conversations if available, otherwise fallback to context
  const conversations = apiConversations.length > 0 ? apiConversations.map(conv => ({
    id: conv.id,
    otherUserId: conv.otherUserId,
    otherUserName: conv.otherUserName,
    lastMessage: conv.lastMessage,
    lastMessageTime: conv.lastMessageTime,
    unreadCount: conv.unreadCount,
    jobTitle: conv.jobTitle,
  })) : useMemo(() => {
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

  const filteredConversations = useMemo(() => {
    return conversations.filter((conv) =>
      conv.otherUserName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.jobTitle?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [conversations, searchQuery]);

  const selectedMessages = useMemo(() => {
    if (!selectedConversationId && !selectedConversation) return [];
    if (!user) return [];

    // If we have API messages for this conversation, use them
    if (selectedConversationId && apiMessages.length > 0) {
      return apiMessages.sort((a, b) => 
        new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()
      );
    }

    // Otherwise fallback to context messages
    if (!selectedConversation) return [];
    const [userId1, userId2] = selectedConversation.split("-");
    const otherUserId = userId1 === user.id ? userId2 : userId1;

    return contextMessages
      .filter(
        (msg) =>
          (msg.senderId === user.id && msg.receiverId === otherUserId) ||
          (msg.receiverId === user.id && msg.senderId === otherUserId)
      )
      .sort((a, b) => 
        new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()
      );
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
        
        if (response.success) {
          setNewMessage("");
          // Refresh messages
          await fetchMessages(selectedConversationId);
        } else {
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

  const handleSelectConversation = useCallback((conversationId: string) => {
    // Check if it's an API conversation ID or old format
    const apiConv = apiConversations.find(c => c.id === conversationId);
    if (apiConv) {
      setSelectedConversationId(conversationId);
      setSelectedConversation(null);
    } else {
      setSelectedConversation(conversationId);
      setSelectedConversationId(null);
    }
  }, [apiConversations]);

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
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: "Messages",
          headerStyle: {
            backgroundColor: Colors.surface,
          },
          headerTitleStyle: {
            color: Colors.text,
            fontWeight: "700" as const,
          },
        }}
      />

      <View style={styles.searchContainer}>
        <Search size={20} color={Colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search messages..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={Colors.textTertiary}
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
              item.unreadCount > 0 && styles.conversationUnread,
            ]}
            onPress={() => handleSelectConversation(item.id)}
          >
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>
                {item.otherUserName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </Text>
              {item.unreadCount > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadBadgeText}>{item.unreadCount}</Text>
                </View>
              )}
            </View>

            <View style={styles.conversationContent}>
              <View style={styles.conversationHeader}>
                <Text style={styles.conversationName} numberOfLines={1}>
                  {item.otherUserName}
                </Text>
                <View style={styles.timeContainer}>
                  <Clock size={12} color={Colors.textTertiary} />
                  <Text style={styles.conversationTime}>
                    {formatTime(item.lastMessageTime)}
                  </Text>
                </View>
              </View>
              {item.jobTitle && (
                <Text style={styles.jobTitle} numberOfLines={1}>
                  {item.jobTitle}
                </Text>
              )}
              <Text
                style={[
                  styles.lastMessage,
                  item.unreadCount > 0 && styles.lastMessageUnread,
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
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.emptyStateText}>Loading conversations...</Text>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <MessageCircle size={48} color={Colors.textTertiary} />
              <Text style={styles.emptyStateTitle}>No Messages</Text>
              <Text style={styles.emptyStateText}>
                Your conversations will appear here
              </Text>
            </View>
          )
        }
      />

      <Modal
        visible={selectedConversation !== null}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        {selectedConversation && (
          <KeyboardAvoidingView
            style={styles.chatContainer}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 20}
          >
            <View style={styles.chatHeader}>
              <Text style={styles.chatTitle}>
                {(() => {
                  const conv = conversations.find((c) => c.id === selectedConversation);
                  if (conv) return conv.otherUserName;
                  
                  if (params.userId && selectedConversation) {
                    const [userId1, userId2] = selectedConversation.split("-");
                    const otherUserId = userId1 === user?.id ? userId2 : userId1;
                    // Get user name from conversation or use fallback
                    const conv = conversations.find(c => c.id === selectedConversation);
                    return conv?.otherUserName || "User";
                  }
                  return "Chat";
                })()}
              </Text>
              <TouchableOpacity onPress={() => {
                setSelectedConversation(null);
                if (params.userId) {
                  router.back();
                }
              }}>
                <X size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.messagesScroll}
              contentContainerStyle={styles.messagesContent}
            >
              {selectedMessages.map((msg) => (
                <View
                  key={msg.id}
                  style={[
                    styles.messageContainer,
                    msg.senderId === user?.id
                      ? styles.messageContainerSent
                      : styles.messageContainerReceived,
                  ]}
                >
                  <View
                    style={[
                      styles.messageBubble,
                      msg.senderId === user?.id
                        ? styles.messageBubbleSent
                        : styles.messageBubbleReceived,
                    ]}
                  >
                    <Text
                      style={[
                        styles.messageText,
                        msg.senderId === user?.id && styles.messageTextSent,
                      ]}
                    >
                      {msg.message}
                    </Text>
                    <Text style={styles.messageTime}>
                      {new Date(msg.sentAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                  </View>
                </View>
              ))}
            </ScrollView>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.messageInput}
                placeholder="Type a message..."
                value={newMessage}
                onChangeText={setNewMessage}
                placeholderTextColor={Colors.textTertiary}
                multiline
                maxLength={500}
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  (!newMessage.trim() || sending) && styles.sendButtonDisabled,
                ]}
                onPress={handleSendMessage}
                disabled={!newMessage.trim() || sending}
              >
                <Send size={20} color={Colors.white} />
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
    backgroundColor: Colors.background,
  },
  searchContainer: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    margin: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
  },
  listContent: {
    paddingHorizontal: 16,
  },
  conversationCard: {
    flexDirection: "row" as const,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  conversationUnread: {
    borderColor: Colors.primary,
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
    backgroundColor: Colors.primary + "20",
    textAlign: "center" as const,
    lineHeight: 50,
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.primary,
  },
  unreadBadge: {
    position: "absolute" as const,
    top: -4,
    right: -4,
    backgroundColor: Colors.error,
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
    color: Colors.white,
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
    color: Colors.text,
    marginRight: 8,
  },
  timeContainer: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 4,
  },
  conversationTime: {
    fontSize: 12,
    color: Colors.textTertiary,
  },
  jobTitle: {
    fontSize: 13,
    color: Colors.primary,
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  lastMessageUnread: {
    fontWeight: "600" as const,
    color: Colors.text,
  },
  emptyState: {
    alignItems: "center" as const,
    justifyContent: "center" as const,
    paddingVertical: 64,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  chatContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  chatHeader: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  chatTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.text,
  },
  messagesScroll: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  messageContainer: {
    marginBottom: 12,
  },
  messageContainerSent: {
    alignItems: "flex-end" as const,
  },
  messageContainerReceived: {
    alignItems: "flex-start" as const,
  },
  messageBubble: {
    maxWidth: "75%",
    borderRadius: 16,
    padding: 12,
  },
  messageBubbleSent: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  messageBubbleReceived: {
    backgroundColor: Colors.surface,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    color: Colors.text,
    marginBottom: 4,
  },
  messageTextSent: {
    color: Colors.white,
  },
  messageTime: {
    fontSize: 11,
    color: Colors.textTertiary,
  },
  inputContainer: {
    flexDirection: "row" as const,
    padding: 16,
    paddingBottom: Platform.OS === "ios" ? 16 : 16,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 12,
  },
  messageInput: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: Colors.text,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
