import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    ScrollView,
    Platform,
    ActivityIndicator
} from 'react-native';
import { Search, UserPlus } from 'lucide-react-native';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { BlurView } from 'expo-blur';

export default function FriendsScreen() {
    const [searchQuery, setSearchQuery] = useState('');
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
    const handleUserPress = (otherUser: any) => {
        const chatId = getChatId(otherUser.uid);
        navigation.navigate('Chat', { chatId, otherUser });
    };

    // Filter users based on search query
    const filteredUsers = users.filter(u =>
        u.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            {/* Header - Fixed Position */}
            <BlurView intensity={30} tint="dark" style={styles.header}>
                <View style={styles.headerContent}>
                    <Text style={styles.brand}>FAULTYHERMES</Text>
                </View>
            </BlurView>

            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.contentContainer}
                keyboardShouldPersistTaps="handled"
            >
                <Text style={styles.pageTitle}>Find Friends</Text>

                <View style={styles.searchCard}>
                    <View style={styles.searchContainer}>
                        <Search color="#999" size={20} style={styles.searchIcon} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search by username..."
                            placeholderTextColor="#999"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>
                    <TouchableOpacity style={styles.searchButton}>
                        <Text style={styles.searchButtonText}>SEARCH</Text>
                    </TouchableOpacity>
                </View>

                {loading ? (
                    <View style={styles.emptyState}>
                        <ActivityIndicator size="large" color="#7cc950" />
                        <Text style={styles.emptyText}>Loading users...</Text>
                    </View>
                ) : filteredUsers.length > 0 ? (
                    <View style={styles.usersList}>
                        {filteredUsers.map((u) => (
                            <TouchableOpacity
                                key={u.uid}
                                style={styles.userCard}
                                onPress={() => handleUserPress(u)}
                            >
                                <View style={styles.userAvatar}>
                                    <Text style={styles.userAvatarText}>
                                        {u.displayName?.charAt(0).toUpperCase() || '?'}
                                    </Text>
                                </View>
                                <View style={styles.userInfo}>
                                    <Text style={styles.userName}>{u.displayName || 'Unknown'}</Text>
                                    <Text style={styles.userLanguage}>
                                        Learning {u.targetLanguage || 'N/A'}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                ) : (
                    <View style={styles.emptyState}>
                        <UserPlus size={64} color="#ccc" />
                        <Text style={styles.emptyText}>
                            {searchQuery ? 'No users found' : 'Search for people to start learning together!'}
                        </Text>
                    </View>
                )}
            </ScrollView>
        </KeyboardAvoidingView>
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
        flexGrow: 1,
        paddingTop: 130,
    },
    pageTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 20,
    },
    searchCard: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 12,
        marginBottom: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        paddingHorizontal: 15,
        height: 45,
        marginBottom: 12,
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        color: '#333',
        fontSize: 16,
    },
    searchButton: {
        backgroundColor: '#7cc950',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    searchButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        opacity: 0.7,
        paddingTop: 50,
    },
    emptyText: {
        color: '#666',
        marginTop: 20,
        textAlign: 'center',
        fontSize: 16,
        width: '70%',
    },
    usersList: {
        gap: 12,
    },
    userCard: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    userAvatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#7cc950',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    userAvatarText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    userLanguage: {
        fontSize: 14,
        color: '#666',
    },
});
