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
import { ArrowLeft, Send, Paperclip, Camera, Mic } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'react-native'; // Ensure Image is imported for rendering
import { db, storage } from '../config/firebase';
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
    mediaUrl?: string;         // URL for image/audio
    mediaType?: 'image' | 'audio'; // Type of media
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
    const [uploading, setUploading] = useState(false);

    // --- Image Handling ---

    const pickImage = async (source: 'library' | 'camera') => {
        try {
            let result;
            if (source === 'camera') {
                const permission = await ImagePicker.requestCameraPermissionsAsync();
                if (permission.status !== 'granted') {
                    alert('Camera permission is required!');
                    return;
                }
                result = await ImagePicker.launchCameraAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.Images,
                    quality: 0.7,
                });
            } else {
                const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (permission.status !== 'granted') {
                    alert('Media library permission is required!');
                    return;
                }
                result = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.Images,
                    quality: 0.7,
                });
            }

            if (!result.canceled && result.assets && result.assets[0].uri) {
                await uploadImage(result.assets[0].uri);
            }
        } catch (error) {
            console.error('Error picking image:', error);
            alert('Failed to pick image');
        }
    };

    const uploadImage = async (uri: string) => {
        if (!chatId) return;
        setUploading(true);
        try {
            const response = await fetch(uri);
            const blob = await response.blob();

            const filename = `chats/${chatId}/${Date.now()}_image.jpg`;
            const storageRef = ref(storage, filename);

            await uploadBytes(storageRef, blob);
            const downloadUrl = await getDownloadURL(storageRef);

            await handleSendMedia(downloadUrl, 'image');
        } catch (error) {
            console.error('Error uploading image:', error);
            alert('Failed to upload image');
        } finally {
            setUploading(false);
        }
    };

    const handleSendMedia = async (url: string, type: 'image' | 'audio') => {
        if (!user || !chatId) return;

        try {
            const messagesRef = collection(db, 'chats', chatId, 'messages');
            await addDoc(messagesRef, {
                text: type === 'image' ? '📷 Photo' : '🎤 Voice Message',
                translated: '', // No translation needed for media placeholder
                shadow: '',
                mediaUrl: url,
                mediaType: type,
                senderNativeLanguage: myNativeLanguageCode,
                senderTargetLanguage: myTargetLanguageCode,
                receiverTargetLanguage: otherUserTargetLanguageCode,
                senderId: user.uid,
                senderName: user.displayName || 'Unknown',
                timestamp: serverTimestamp(),
            });
        } catch (error) {
            console.error('Error sending media:', error);
        }
    };
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

            // IMPROVED LOGIC: Auto-detect if user typed in Native or Target
            // 1. Try translating assuming they typed in TARGET (Standard Flow)
            let shadowLink = await translateText(
                messageText,
                myTargetLanguageCode,      // FROM: Target
                myNativeLanguageCode       // TO: Native
            );

            // 2. If translation equals original (e.g. typed "Hello" in English), 
            //    it means they likely typed in NATIVE. Swap direction!
            if (shadowLink.translatedText.toLowerCase() === messageText.toLowerCase()) {
                shadowLink = await translateText(
                    messageText,
                    myNativeLanguageCode,    // FROM: Native
                    myTargetLanguageCode     // TO: Target
                );
            }

            // 3. Receiver always needs it in THEIR Target Language
            //    We translate from whatever language we detected the user used
            const sourceLang = (shadowLink.translatedText.toLowerCase() === messageText.toLowerCase())
                ? myTargetLanguageCode // Fallback (shouldn't happen if swap worked)
                : (shadowLink === shadowLink ? myNativeLanguageCode : myTargetLanguageCode); // Simplified: Just use detected source

            // Actually, simplest reliability is translate from Detected Source -> Receiver Target
            const receiverTranslation = await translateText(
                messageText,
                myNativeLanguageCode,    // Try from Native first (safest bet for correct meaning)
                otherUserTargetLanguageCode
            );

            // If that failed (same text), try from Target
            let finalReceiverText = receiverTranslation.translatedText;
            if (finalReceiverText.toLowerCase() === messageText.toLowerCase()) {
                const retry = await translateText(
                    messageText,
                    myTargetLanguageCode,
                    otherUserTargetLanguageCode
                );
                finalReceiverText = retry.translatedText;
            }

            const messagesRef = collection(db, 'chats', chatId, 'messages');
            await addDoc(messagesRef, {
                // Original text
                text: messageText,
                // Shadow text (The other language version for ME)
                shadow: shadowLink.translatedText || '',
                // Translated text for receiver
                translated: finalReceiverText || messageText,
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
                    {/* Media Display */}
                    {message.mediaUrl && message.mediaType === 'image' && (
                        <Image
                            source={{ uri: message.mediaUrl }}
                            style={styles.chatImage}
                            resizeMode="cover"
                        />
                    )}

                    {/* Text Display */}
                    {(!message.mediaUrl || (message.text !== '📷 Photo' && message.text !== '🎤 Voice Message')) && (
                        <View>
                            <Text style={[
                                styles.messageText,
                                isMyMessage ? styles.myMessageText : styles.theirMessageText,
                                message.mediaUrl ? { marginTop: 8 } : {}
                            ]}>
                                {isMyMessage ? message.text : (message.translated || message.text)}
                            </Text>

                            {/* Read Receipt INSIDE bubble for Sent messages */}
                            {isMyMessage && (
                                <Text style={[
                                    styles.readReceipt,
                                    isRead ? styles.readReceiptRead : styles.readReceiptSent
                                ]}>
                                    {isRead ? ' ✓✓' : ' ✓'}
                                </Text>
                            )}
                        </View>
                    )}
                </View>

                {/* Shadow Bubble / Translation Row */}
                <View style={[
                    styles.messageMetaRow,
                    isMyMessage ? styles.myMetaRow : styles.theirMetaRow
                ]}>
                    {isMyMessage ? (
                        /* MY messages: Show Shadow Bubble (native language reinforcement) */
                        message.shadow && message.shadow.trim() !== '' && message.shadow.toLowerCase() !== message.text.toLowerCase() ? (
                            <View style={styles.shadowBubble}>
                                <Text style={styles.shadowText}>
                                    {message.shadow}
                                </Text>
                            </View>
                        ) : null
                    ) : (
                        /* THEIR messages: Show original text in a bubble too */
                        message.text && message.translated && message.text.toLowerCase() !== message.translated.toLowerCase() ? (
                            <View style={[styles.shadowBubble, { backgroundColor: '#fff', alignSelf: 'flex-start' }]}>
                                <Text style={[styles.shadowText, { color: '#666' }]}>
                                    {message.text}
                                </Text>
                            </View>
                        ) : null
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
            {/* WhatsApp-Style Header with Glassmorphism */}
            <BlurView intensity={80} tint="dark" style={styles.headerBlur}>
                <View style={styles.header}>
                    {/* Back Button with Badge */}
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <ArrowLeft color="#fff" size={22} />
                    </TouchableOpacity>

                    {/* User Info Pill */}
                    <View style={styles.userPill}>
                        <Text style={styles.headerTitle} numberOfLines={1}>
                            {otherUser?.displayName || 'Chat'}
                        </Text>
                        <Text style={styles.headerSubtitle}>
                            Learning {otherUser?.targetLanguage || 'N/A'}
                        </Text>
                    </View>

                    {/* User Avatar */}
                    <View style={styles.headerAvatar}>
                        <Text style={styles.headerAvatarText}>
                            {(otherUser?.displayName || 'U')[0].toUpperCase()}
                        </Text>
                    </View>
                </View>

                {/* Progress Bar inside header */}
                <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: '50%' }]} />
                    </View>
                    <Text style={styles.pointsText}>💎 500</Text>
                </View>
            </BlurView>

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

            {/* WhatsApp-Style Input with Glassmorphism */}
            <BlurView intensity={60} tint="light" style={styles.inputBlur}>
                <View style={styles.inputContainer}>
                    {/* Attachment Button */}
                    <TouchableOpacity
                        style={styles.iconButton}
                        onPress={() => pickImage('library')}
                        disabled={uploading || sending}
                    >
                        {uploading ? (
                            <ActivityIndicator size="small" color="#666" />
                        ) : (
                            <Paperclip color="#666" size={22} />
                        )}
                    </TouchableOpacity>

                    {/* Message Input Field */}
                    <View style={styles.inputWrapper}>
                        <TextInput
                            style={styles.input}
                            placeholder={uploading ? "Uploading..." : "Message"}
                            placeholderTextColor="#999"
                            value={newMessage}
                            onChangeText={handleTextChange}
                            multiline
                            maxLength={500}
                            editable={!uploading}
                        />
                        {/* Camera inside input */}
                        <TouchableOpacity
                            style={styles.cameraButton}
                            onPress={() => pickImage('camera')}
                            disabled={uploading || sending}
                        >
                            <Camera color="#666" size={20} />
                        </TouchableOpacity>
                    </View>

                    {/* Send or Mic Button */}
                    {newMessage.trim() ? (
                        <TouchableOpacity
                            style={[styles.sendButton, sending && styles.sendButtonDisabled]}
                            onPress={() => {
                                updateTypingStatus(false);
                                handleSend();
                            }}
                            disabled={sending}
                        >
                            {sending ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Send color="#fff" size={18} />
                            )}
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity style={styles.micButton}>
                            <Mic color="#fff" size={20} />
                        </TouchableOpacity>
                    )}
                </View>
            </BlurView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#e8efe5', // WhatsApp-like light green background
    },
    // Glass Header Container
    headerBlur: {
        backgroundColor: 'rgba(26, 42, 58, 0.95)',
        paddingTop: Platform.OS === 'ios' ? 50 : 10,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 15,
    },
    backButton: {
        backgroundColor: 'rgba(124, 201, 80, 0.2)',
        borderRadius: 20,
        padding: 8,
        marginRight: 10,
    },
    userPill: {
        flex: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 20,
        paddingVertical: 8,
        paddingHorizontal: 15,
        marginRight: 10,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
    headerSubtitle: {
        fontSize: 11,
        color: 'rgba(255, 255, 255, 0.7)',
        marginTop: 2,
    },
    headerAvatar: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: '#7cc950',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    headerAvatarText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    headerInfo: {
        flex: 1,
    },
    // Progress inside header
    progressContainer: {
        paddingHorizontal: 15,
        paddingVertical: 8,
        flexDirection: 'row',
        alignItems: 'center',
    },
    progressBar: {
        flex: 1,
        height: 6,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 3,
        marginRight: 12,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#7cc950',
        borderRadius: 3,
    },
    pointsText: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#fff',
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
        shadowRadius: 2,
        elevation: 2,
    },
    chatImage: {
        width: 200,
        height: 150,
        borderRadius: 8,
        marginBottom: 4,
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
    // Input Area Styles
    inputBlur: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingBottom: Platform.OS === 'ios' ? 25 : 10,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: 10,
        paddingVertical: 8,
    },
    iconButton: {
        padding: 10,
        marginBottom: 2,
    },
    inputWrapper: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
        borderRadius: 25,
        paddingLeft: 15,
        paddingRight: 8,
        marginHorizontal: 5,
        minHeight: 46,
    },
    input: {
        flex: 1,
        fontSize: 15,
        maxHeight: 100,
        paddingVertical: 10,
        color: '#333',
    },
    cameraButton: {
        padding: 8,
        marginLeft: 5,
    },
    sendButton: {
        backgroundColor: '#7cc950',
        width: 46,
        height: 46,
        borderRadius: 23,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButtonDisabled: {
        backgroundColor: '#a5d882',
    },
    micButton: {
        backgroundColor: '#7cc950',
        width: 46,
        height: 46,
        borderRadius: 23,
        justifyContent: 'center',
        alignItems: 'center',
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
        marginTop: 2,
        gap: 8,
    },
    myMetaRow: {
        justifyContent: 'flex-end',
        alignItems: 'flex-start', // Align shadow bubble to end but text inside to start
    },
    theirMetaRow: {
        justifyContent: 'flex-start',
    },
    readReceipt: {
        fontSize: 10,
        fontWeight: 'bold',
        marginTop: 2,
        alignSelf: 'flex-end',
    },
    readReceiptSent: {
        color: 'rgba(255, 255, 255, 0.7)',
    },
    readReceiptRead: {
        color: '#4fc3f7', // Light blue for read status on green background
    },
    // Shadow Bubble - styled for visual reinforcement
    shadowBubble: {
        backgroundColor: '#e1e1e1', // Darker gray for visibility
        borderRadius: 12,
        borderTopRightRadius: 2,
        paddingVertical: 6,
        paddingHorizontal: 10,
        marginRight: 4,
        marginTop: 2, // Positive margin to ensure visibility
        maxWidth: '80%',
        borderWidth: 1,
        borderColor: '#ccc',
    },
    shadowText: {
        fontSize: 12,
        color: '#444',
        fontStyle: 'italic',
    },
    // Original text - shows original message for received messages
    originalText: {
        fontSize: 12,
        color: '#999',
        fontStyle: 'italic',
        marginLeft: 4,
        marginTop: 2,
    },
});
