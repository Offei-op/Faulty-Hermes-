import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { ArrowLeft } from 'lucide-react-native';

export default function ChatScreen() {
    const route = useRoute<any>();
    const navigation = useNavigation();
    const { chatId, otherUser } = route.params || {};

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft color="#7cc950" size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{otherUser?.displayName || 'Chat'}</Text>
            </View>

            {/* Temp content */}
            <View style={styles.content}>
                <Text style={styles.chatId}>Chat ID: {chatId}</Text>
                <Text style={styles.info}>
                    Chatting with {otherUser?.displayName}
                </Text>
                <Text style={styles.info}>
                    Learning {otherUser?.targetLanguage}
                </Text>
                <Text style={styles.placeholder}>
                    🚧 Chat functionality coming soon!
                </Text>
            </View>
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
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 3,
        borderBottomColor: '#7cc950',
    },
    backButton: {
        marginRight: 15,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#7cc950',
        letterSpacing: 1,
    },
    content: {
        flex: 1,
        padding: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    chatId: {
        fontSize: 12,
        color: '#999',
        marginBottom: 10,
    },
    info: {
        fontSize: 16,
        color: '#666',
        marginBottom: 8,
    },
    placeholder: {
        fontSize: 18,
        color: '#333',
        marginTop: 30,
        textAlign: 'center',
    },
});
