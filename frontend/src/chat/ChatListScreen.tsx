import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { MessageSquare } from 'lucide-react-native';

// Mock Data
const CONVERSATIONS = [
    { id: '1', name: 'Maria Garcia', lastMessage: 'Hola, ¿cómo estás?', time: '2m ago', unread: 2 },
    { id: '2', name: 'Jean Pierre', lastMessage: 'Merci beaucoup!', time: '1h ago', unread: 0 },
];

export default function ChatListScreen() {
    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.brand}>FAULTYHERMES</Text>
            </View>

            <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
                <Text style={styles.pageTitle}>Messages</Text>

                {CONVERSATIONS.length > 0 ? (
                    CONVERSATIONS.map(item => (
                        <TouchableOpacity key={item.id} style={styles.chatItem}>
                            <View style={styles.avatar}>
                                <Text style={styles.avatarText}>{item.name[0]}</Text>
                            </View>
                            <View style={styles.chatContent}>
                                <View style={styles.chatHeader}>
                                    <Text style={styles.chatName}>{item.name}</Text>
                                    <Text style={styles.chatTime}>{item.time}</Text>
                                </View>
                                <Text style={styles.lastMessage} numberOfLines={1}>{item.lastMessage}</Text>
                            </View>
                            {item.unread > 0 && (
                                <View style={styles.unreadBadge}>
                                    <Text style={styles.unreadText}>{item.unread}</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    ))
                ) : (
                    <View style={styles.emptyContainer}>
                        <MessageSquare size={48} color="#ccc" />
                        <Text style={styles.emptyText}>No conversations yet</Text>
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
        backgroundColor: '#1a2a3a',
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderBottomWidth: 3,
        borderBottomColor: '#7cc950',
    },
    brand: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#7cc950',
        letterSpacing: 1,
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        padding: 20,
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
