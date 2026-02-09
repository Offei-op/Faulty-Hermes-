import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { MessageSquare } from 'lucide-react-native';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { BlurView } from 'expo-blur';

export default function ChatListScreen() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const navigation = useNavigation<any>();

    // Fetch all users from Firestore
    useEffect(() => {
        if (!user) return;

        const usersQuery = query(collection(db, 'users'));
        const unsubscribe = onSnapshot(usersQuery, (snapshot) => {
            const fetchedUsers = snapshot.docs
                .map(doc => doc.data())
                .filter(u => u.uid !== user.uid); // Exclude current user

            setUsers(fetchedUsers);
            setLoading(false);
        }, (error) => {
            console.error('Error fetching users:', error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    // Generate chatId by sorting UIDs alphabetically
    const getChatId = (otherUserId: string) => {
        const ids = [user.uid, otherUserId].sort();
        return ids.join('_');
    };

    // Navigate to Chat screen
    const handleChatPress = (otherUser: any) => {
        const chatId = getChatId(otherUser.uid);
        navigation.navigate('Chat', { chatId, otherUser });
    };

    return (
        <View style={styles.container}>
            {/* Header - Fixed Position */}
            <BlurView intensity={10} tint="dark" style={styles.header}>
                <View style={styles.headerContent}>
                    <Text style={styles.brand}>FAULTYHERMES</Text>
                </View>
            </BlurView>

            <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
                <Text style={styles.pageTitle}>Messages</Text>

                {loading ? (
                    <View style={styles.emptyContainer}>
                        <ActivityIndicator size="large" color="#7cc950" />
                        <Text style={styles.emptyText}>Loading users...</Text>
                    </View>
                ) : users.length > 0 ? (
                    users.map(item => (
                        <TouchableOpacity key={item.uid} style={styles.chatItem} onPress={() => handleChatPress(item)}>
                            <View style={styles.avatar}>
                                <Text style={styles.avatarText}>{item.displayName?.[0]?.toUpperCase() || '?'}</Text>
                            </View>
                            <View style={styles.chatContent}>
                                <View style={styles.chatHeader}>
                                    <Text style={styles.chatName}>{item.displayName || 'Unknown'}</Text>
                                    <Text style={styles.chatTime}>Click to chat</Text>
                                </View>
                                <Text style={styles.lastMessage} numberOfLines={1}>
                                    Learning {item.targetLanguage || 'N/A'}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    ))
                ) : (
                    <View style={styles.emptyContainer}>
                        <MessageSquare size={48} color="#ccc" />
                        <Text style={styles.emptyText}>No users yet</Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        position: 'absolute',
        top: 50,
        left: 50,
        right: 50,
        zIndex: 100,
        backgroundColor: 'transparent',
        overflow: 'hidden',
        borderRadius: 35,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        height: 60,
    },
    headerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    brand: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#7cc950',
        letterSpacing: 1,
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        padding: 20,
        paddingTop: 130,
    },
    pageTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 20,
    },
    chatItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 12,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#7cc950',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    avatarText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
    },
    chatContent: {
        flex: 1,
    },
    chatHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 5,
    },
    chatName: {
        color: '#333',
        fontSize: 16,
        fontWeight: '600',
    },
    chatTime: {
        color: '#999',
        fontSize: 12,
    },
    lastMessage: {
        color: '#666',
        fontSize: 14,
    },
    unreadBadge: {
        backgroundColor: '#7cc950',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 10,
        paddingHorizontal: 5,
    },
    unreadText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 100,
    },
    emptyText: {
        color: '#999',
        marginTop: 10,
        fontSize: 16,
    },
});
