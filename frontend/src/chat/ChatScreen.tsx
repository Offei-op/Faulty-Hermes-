import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { ArrowLeft, Send } from 'lucide-react-native';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { translateText, getLanguageCode } from '../services/translationService';

interface Message {
    id: string;
    text: string;              // Original message text
    translated?: string;       // Translated text
    shadow?: string;           // Shadow text (original for Shadow Bubble feature)
    targetLanguage?: string;   // Receiver's language code
    senderId: string;
    senderName: string;
    timestamp: any;
    translation?: string;      // Legacy field (kept for backwards compatibility)
    readBy?: string[];         // Array of user IDs who have read this message
    readAt?: any;              // Timestamp when message was read
}

export default function ChatScreen() {
    const route = useRoute<any>();
    const navigation = useNavigation();
    const { user, userProfile } = useAuth();
    const { chatId, otherUser } = route.params || {};

    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const scrollViewRef = useRef<ScrollView>(null);

    // Get language codes for translation
    // MY languages (sender)
    const myNativeLanguage = userProfile?.nativeLanguage || 'English';
    const myNativeLanguageCode = getLanguageCode(myNativeLanguage);
    const myTargetLanguage = userProfile?.targetLanguage || 'French';
    const myTargetLanguageCode = getLanguageCode(myTargetLanguage);

    // OTHER USER's languages (receiver)
    const otherUserNativeLanguage = otherUser?.nativeLanguage || 'English';
    const otherUserNativeLanguageCode = getLanguageCode(otherUserNativeLanguage);
    const otherUserTargetLanguage = otherUser?.targetLanguage || 'French';
    const otherUserTargetLanguageCode = getLanguageCode(otherUserTargetLanguage);

    // Mark messages as read
    const markMessagesAsRead = async (messagesToMark: Message[]) => {
        if (!user || !chatId) return;

        const { doc, updateDoc, arrayUnion } = await import('firebase/firestore');

        // Find unread messages from other users
        const unreadMessages = messagesToMark.filter(
            msg => msg.senderId !== user.uid && (!msg.readBy || !msg.readBy.includes(user.uid))
        );

        // Mark each as read
        for (const msg of unreadMessages) {
            try {
                const msgRef = doc(db, 'chats', chatId, 'messages', msg.id);
                await updateDoc(msgRef, {
                    readBy: arrayUnion(user.uid),
                    readAt: serverTimestamp(),
                });
            } catch (error) {
                // Silently fail - non-critical
            }
        }
    };

    // Fetch messages in real-time
    useEffect(() => {
        if (!chatId) return;

        const messagesRef = collection(db, 'chats', chatId, 'messages');
        const messagesQuery = query(messagesRef, orderBy('timestamp', 'asc'));

        const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
            const fetchedMessages = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Message[];

            setMessages(fetchedMessages);
            setLoading(false);

            // Mark messages as read when they arrive
            markMessagesAsRead(fetchedMessages);

            // Scroll to bottom when new message arrives
            setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: true });
            }, 100);
        }, (error) => {
            console.error('Error fetching messages:', error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [chatId]);

    const handleSend = async () => {
        if (!newMessage.trim() || !user || !chatId) return;

        const messageText = newMessage.trim();
        setSending(true);
        setNewMessage(''); // Clear input immediately for better UX

        try {
            // Per documentation (Section 4.5 & 9):
            // - User types in their TARGET language (practicing)
            // - Shadow Bubble shows translation to their NATIVE language (reinforcement)
            // 
            // Example: User learning French types "Bonjour"
            // - Primary Bubble: "Bonjour" (original)
            // - Shadow Bubble: "Hello" (translated to native English)

            // SHADOW: Translate FROM my target language TO my native language
            // (Helps ME understand what I said in my native language)
            const shadowTranslation = await translateText(
                messageText,
                myTargetLanguageCode,      // FROM: my target language (what I typed in)
                myNativeLanguageCode       // TO: my native language (for reinforcement)
            );

            // RECEIVER: Translate FOR the other user TO their target language
            // (Helps THEM practice reading in their target language)
            const receiverTranslation = await translateText(
                messageText,
                myTargetLanguageCode,           // FROM: the language I typed in
                otherUserTargetLanguageCode     // TO: receiver's target language
            );

            const messagesRef = collection(db, 'chats', chatId, 'messages');
            await addDoc(messagesRef, {
                // Original text (what the user typed - in their target language)
                text: messageText,
                // Shadow text - translation to sender's native language (for Shadow Bubble)
                shadow: shadowTranslation.translatedText || '',
                // Translated text for receiver (in their target language)
                translated: receiverTranslation.translatedText || messageText,
                // Language metadata
                senderNativeLanguage: myNativeLanguageCode,
                senderTargetLanguage: myTargetLanguageCode,
                receiverTargetLanguage: otherUserTargetLanguageCode,
                // Metadata
                senderId: user.uid,
                senderName: user.displayName || 'Unknown',
                timestamp: serverTimestamp(),
            });
        } catch (error) {
            console.error('Error sending message:', error);
            setNewMessage(messageText); // Restore message on error
        } finally {
            setSending(false);
        }
    };

    // Typing indicator state
    const [isOtherTyping, setIsOtherTyping] = useState(false);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Listen for other user's typing status
    useEffect(() => {
        if (!chatId || !otherUser?.uid) return;

        const typingRef = collection(db, 'chats', chatId, 'typing');
        const unsubscribe = onSnapshot(typingRef, (snapshot) => {
            const typingUsers = snapshot.docs
                .map(doc => doc.data())
                .filter(t => t.uid !== user?.uid && t.isTyping);

            setIsOtherTyping(typingUsers.length > 0);
        });

        return () => unsubscribe();
    }, [chatId, otherUser?.uid, user?.uid]);

    // Update my typing status
    const updateTypingStatus = async (isTyping: boolean) => {
        if (!chatId || !user) return;

        try {
            const { doc, setDoc } = await import('firebase/firestore');
            const typingDocRef = doc(db, 'chats', chatId, 'typing', user.uid);
            await setDoc(typingDocRef, {
                uid: user.uid,
                isTyping,
                timestamp: serverTimestamp(),
            });
        } catch (error) {
            // Silently fail - typing indicator is non-critical
        }
    };

    // Handle text input change with typing indicator
    const handleTextChange = (text: string) => {
        setNewMessage(text);

        // Clear existing timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        // Set typing to true
        if (text.length > 0) {
            updateTypingStatus(true);

            // Auto-stop typing after 3 seconds of inactivity
            typingTimeoutRef.current = setTimeout(() => {
                updateTypingStatus(false);
            }, 3000);
        } else {
            updateTypingStatus(false);
        }
    };

    // Clear typing status when sending/leaving
    useEffect(() => {
        return () => {
            updateTypingStatus(false);
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
        };
    }, []);

    const renderMessage = (message: Message, index: number) => {
        const isMyMessage = message.senderId === user?.uid;
        const isRead = message.readBy && message.readBy.includes(otherUser?.uid);

        // Per documentation (Section 4.5):
        // SENT Messages: Primary Bubble = Original, Shadow Bubble = Native reinforcement
        // RECEIVED Messages: Primary Bubble = Translated, Tap-to-Reveal = Original

        return (
            <View
                key={message.id || index}
                style={[
                    styles.messageContainer,
                    isMyMessage ? styles.myMessageContainer : styles.theirMessageContainer
                ]}
            >
                {/* Primary Message Bubble */}
                <View style={[
                    styles.messageBubble,
                    isMyMessage ? styles.myMessageBubble : styles.theirMessageBubble
                ]}>
                    <Text style={[
                        styles.messageText,
                        isMyMessage ? styles.myMessageText : styles.theirMessageText
                    ]}>
                        {/* For MY messages: show original text
                            For THEIR messages: show translated text (or original if no translation) */}
                        {isMyMessage ? message.text : (message.translated || message.text)}
                    </Text>
                </View>

                {/* Shadow Bubble / Translation Row */}
                <View style={[
                    styles.messageMetaRow,
                    isMyMessage ? styles.myMetaRow : styles.theirMetaRow
                ]}>
                    {isMyMessage ? (
                        /* MY messages: Show Shadow Bubble (native language reinforcement)
                           Only show if shadow exists, is not empty, and differs from original */
                        message.shadow && message.shadow.trim() !== '' && message.shadow.toLowerCase() !== message.text.toLowerCase() ? (
                            <Text style={styles.shadowText}>
                                {message.shadow}
                            </Text>
                        ) : null
                    ) : (
                        /* THEIR messages: Show original text below translated message
                           Only show if original differs from what we're displaying */
                        message.text && message.translated && message.text.toLowerCase() !== message.translated.toLowerCase() ? (
                            <Text style={styles.originalText}>
                                {message.text}
                            </Text>
                        ) : null
                    )}

                    {/* Read Receipt - only for my messages */}
                    {isMyMessage && (
                        <Text style={[
                            styles.readReceipt,
                            isRead ? styles.readReceiptRead : styles.readReceiptSent
                        ]}>
                            {isRead ? '✓✓' : '✓'}
                        </Text>
                    )}
                </View>
            </View>
        );
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={0}
        >
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft color="#7cc950" size={24} />
                </TouchableOpacity>
                <View style={styles.headerInfo}>
                    <Text style={styles.headerTitle}>{otherUser?.displayName || 'Chat'}</Text>
                    <Text style={styles.headerSubtitle}>
                        Learning {otherUser?.targetLanguage || 'N/A'}
                    </Text>
                </View>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: '50%' }]} />
                </View>
                <Text style={styles.pointsText}>💎 500</Text>
            </View>

            {/* Messages */}
            <ScrollView
                ref={scrollViewRef}
                style={styles.messagesContainer}
                contentContainerStyle={styles.messagesContent}
                onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
            >
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#7cc950" />
                    </View>
                ) : messages.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyEmoji}>💬</Text>
                        <Text style={styles.emptyText}>
                            Start a conversation with {otherUser?.displayName}!
                        </Text>
                        <Text style={styles.emptySubtext}>
                            Practice {otherUser?.targetLanguage} together
                        </Text>
                    </View>
                ) : (
                    messages.map((message, index) => renderMessage(message, index))
                )}

                {/* Typing Indicator */}
                {isOtherTyping && (
                    <View style={styles.typingContainer}>
                        <View style={styles.typingBubble}>
                            <View style={styles.typingDots}>
                                <View style={[styles.typingDot, styles.typingDot1]} />
                                <View style={[styles.typingDot, styles.typingDot2]} />
                                <View style={[styles.typingDot, styles.typingDot3]} />
                            </View>
                        </View>
                        <Text style={styles.typingText}>
                            {otherUser?.displayName} is typing...
                        </Text>
                    </View>
                )}
            </ScrollView>

            {/* Input */}
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="Type your message here..."
                    placeholderTextColor="#999"
                    value={newMessage}
                    onChangeText={handleTextChange}
                    multiline
                    maxLength={500}
                />
                <TouchableOpacity
                    style={[styles.sendButton, (!newMessage.trim() || sending) && styles.sendButtonDisabled]}
                    onPress={() => {
                        updateTypingStatus(false);
                        handleSend();
                    }}
                    disabled={!newMessage.trim() || sending}
                >
                    {sending ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Send color="#fff" size={20} />
                    )}
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        backgroundColor: '#1a2a3a',
        paddingVertical: 12,
        paddingHorizontal: 15,
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 3,
        borderBottomColor: '#7cc950',
    },
    backButton: {
        marginRight: 12,
        padding: 5,
    },
    headerInfo: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#7cc950',
    },
    headerSubtitle: {
        fontSize: 12,
        color: '#999',
        marginTop: 2,
    },
    progressContainer: {
        backgroundColor: '#fff',
        paddingHorizontal: 15,
        paddingVertical: 10,
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    progressBar: {
        flex: 1,
        height: 8,
        backgroundColor: '#e0e0e0',
        borderRadius: 4,
        marginRight: 12,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#7cc950',
        borderRadius: 4,
    },
    pointsText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
    },
    messagesContainer: {
        flex: 1,
    },
    messagesContent: {
        padding: 15,
        flexGrow: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 50,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 50,
    },
    emptyEmoji: {
        fontSize: 64,
        marginBottom: 15,
    },
    emptyText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
    },
    messageContainer: {
        marginBottom: 15,
        maxWidth: '75%',
    },
    myMessageContainer: {
        alignSelf: 'flex-end',
        alignItems: 'flex-end',
    },
    theirMessageContainer: {
        alignSelf: 'flex-start',
        alignItems: 'flex-start',
    },
    messageBubble: {
        padding: 12,
        borderRadius: 16,
        maxWidth: '100%',
    },
    myMessageBubble: {
        backgroundColor: '#7cc950',
        borderBottomRightRadius: 4,
    },
    theirMessageBubble: {
        backgroundColor: '#fff',
        borderBottomLeftRadius: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    messageText: {
        fontSize: 15,
        lineHeight: 20,
    },
    myMessageText: {
        color: '#fff',
    },
    theirMessageText: {
        color: '#333',
    },
    translationText: {
        fontSize: 12,
        marginTop: 4,
        fontStyle: 'italic',
    },
    myTranslation: {
        color: '#666',
        textAlign: 'right',
    },
    theirTranslation: {
        color: '#666',
        textAlign: 'left',
    },
    inputContainer: {
        backgroundColor: '#fff',
        paddingHorizontal: 15,
        paddingVertical: 10,
        flexDirection: 'row',
        alignItems: 'flex-end',
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    input: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        borderRadius: 20,
        paddingHorizontal: 15,
        paddingVertical: 10,
        paddingTop: 10,
        fontSize: 15,
        maxHeight: 100,
        marginRight: 10,
        color: '#333',
    },
    sendButton: {
        backgroundColor: '#7cc950',
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButtonDisabled: {
        backgroundColor: '#ccc',
    },
    typingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 5,
    },
    typingBubble: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 10,
        marginRight: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    typingDots: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    typingDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#7cc950',
        marginHorizontal: 2,
    },
    typingDot1: {
        opacity: 0.4,
    },
    typingDot2: {
        opacity: 0.7,
    },
    typingDot3: {
        opacity: 1,
    },
    typingText: {
        fontSize: 12,
        color: '#999',
        fontStyle: 'italic',
    },
    messageMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
        gap: 8,
    },
    myMetaRow: {
        justifyContent: 'flex-end',
    },
    theirMetaRow: {
        justifyContent: 'flex-start',
    },
    readReceipt: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    readReceiptSent: {
        color: '#999',
    },
    readReceiptRead: {
        color: '#7cc950',
    },
    // Shadow Bubble - shows native language reinforcement for sent messages
    shadowText: {
        fontSize: 12,
        color: '#666',
        fontStyle: 'italic',
        marginRight: 8,
    },
    // Original text - shows original message for received messages
    originalText: {
        fontSize: 12,
        color: '#999',
        fontStyle: 'italic',
    },
});
