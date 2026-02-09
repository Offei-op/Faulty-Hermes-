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
    ActivityIndicator,
    Alert
} from 'react-native';
import { Search, UserPlus } from 'lucide-react-native';
import { collection, onSnapshot, query, getDocs, where, doc, setDoc, Timestamp, deleteDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { BlurView } from 'expo-blur';

export default function FriendsScreen() {
    const [searchQuery, setSearchQuery] = useState('');
    const [friends, setFriends] = useState<any[]>([]);
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searching, setSearching] = useState(false);
    const [loading, setLoading] = useState(true);
    const { user, userProfile } = useAuth();
    const navigation = useNavigation<any>();

    // Fetch FRIENDS only (from subcollection)
    useEffect(() => {
        if (!user) return;

        const friendsRef = collection(db, 'users', user.uid, 'friends');
        const unsubscribe = onSnapshot(friendsRef, async (snapshot) => {
            const friendIds = snapshot.docs.map(doc => doc.id);

            if (friendIds.length === 0) {
                setFriends([]);
                setLoading(false);
                return;
            }

            // Fetch friend details
            const friendsData: any[] = [];
            for (const friendId of friendIds) {
                const userQuery = query(collection(db, 'users'), where('uid', '==', friendId));
                const userSnap = await getDocs(userQuery);
                if (!userSnap.empty) {
                    friendsData.push(userSnap.docs[0].data());
                }
            }
            setFriends(friendsData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    // Search for users (all users, not just friends)
    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        setSearching(true);

        try {
            const usersRef = collection(db, 'users');
            const snapshot = await getDocs(usersRef);

            const results = snapshot.docs
                .map(doc => doc.data())
                .filter(u =>
                    u.uid !== user?.uid &&
                    u.displayName?.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .slice(0, 10);

            setSearchResults(results);
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setSearching(false);
        }
    };

    // Check if user is already a friend
    const isFriend = (userId: string) => {
        return friends.some(f => f.uid === userId);
    };

    // Add friend
    const handleAddFriend = async (friendUser: any) => {
        if (!user) return;

        try {
            // Add to my friends list
            await setDoc(doc(db, 'users', user.uid, 'friends', friendUser.uid), {
                addedAt: Timestamp.now(),
                displayName: friendUser.displayName,
            });

            // Also add me to their friends list (mutual)
            await setDoc(doc(db, 'users', friendUser.uid, 'friends', user.uid), {
                addedAt: Timestamp.now(),
                displayName: userProfile?.displayName || user.displayName,
            });

            Alert.alert('Success!', `${friendUser.displayName} added as a friend!`);
            setSearchResults([]);
            setSearchQuery('');
        } catch (error) {
            console.error('Add friend error:', error);
            Alert.alert('Error', 'Could not add friend. Please try again.');
        }
    };

    // Remove friend
    const handleRemoveFriend = async (friendUser: any) => {
        if (!user) return;

        Alert.alert(
            'Remove Friend',
            `Are you sure you want to remove ${friendUser.displayName}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            // Remove from my friends
                            await deleteDoc(doc(db, 'users', user.uid, 'friends', friendUser.uid));
                            // Remove from their friends
                            await deleteDoc(doc(db, 'users', friendUser.uid, 'friends', user.uid));
                        } catch (error) {
                            console.error('Remove friend error:', error);
                        }
                    }
                }
            ]
        );
    };

    // Generate chatId by sorting UIDs alphabetically
    const getChatId = (otherUserId: string) => {
        const ids = [user!.uid, otherUserId].sort();
        return ids.join('_');
    };

    // Navigate to Chat screen
    const handleUserPress = (otherUser: any) => {
        const chatId = getChatId(otherUser.uid);
        navigation.navigate('Chat', { chatId, otherUser });
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            {/* Header - Fixed Position */}
            <BlurView intensity={10} tint="dark" style={styles.header}>
                <View style={styles.headerContent}>
                    <Text style={styles.brand}>FAULTYHERMES</Text>
                </View>
            </BlurView>

            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.contentContainer}
                keyboardShouldPersistTaps="handled"
            >
                <Text style={styles.pageTitle}>Friends</Text>

                {/* Search Section */}
                <View style={styles.searchCard}>
                    <View style={styles.searchContainer}>
                        <Search color="#999" size={20} style={styles.searchIcon} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search for new friends..."
                            placeholderTextColor="#999"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            onSubmitEditing={handleSearch}
                            returnKeyType="search"
                        />
                    </View>
                    <TouchableOpacity
                        style={[styles.searchButton, searching && { opacity: 0.7 }]}
                        onPress={handleSearch}
                        disabled={searching}
                    >
                        {searching ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Text style={styles.searchButtonText}>SEARCH</Text>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Search Results */}
                {searchResults.length > 0 && (
                    <View style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>Search Results</Text>
                        {searchResults.map((u: any) => (
                            <View key={u.uid} style={styles.userCard}>
                                <View style={[styles.userAvatar, styles.searchResultAvatar]}>
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
                                {isFriend(u.uid) ? (
                                    <View style={styles.alreadyFriendBadge}>
                                        <Text style={styles.alreadyFriendText}>✓ Friend</Text>
                                    </View>
                                ) : (
                                    <TouchableOpacity
                                        style={styles.addFriendButton}
                                        onPress={() => handleAddFriend(u)}
                                    >
                                        <Text style={styles.addFriendButtonText}>+ ADD</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        ))}
                    </View>
                )}

                {/* My Friends Section */}
                <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>My Friends</Text>

                    {loading ? (
                        <View style={styles.emptyState}>
                            <ActivityIndicator size="large" color="#7cc950" />
                            <Text style={styles.emptyText}>Loading friends...</Text>
                        </View>
                    ) : friends.length > 0 ? (
                        <View style={styles.usersList}>
                            {friends.map((u: any) => (
                                <TouchableOpacity
                                    key={u.uid}
                                    style={styles.userCard}
                                    onPress={() => handleUserPress(u)}
                                    onLongPress={() => handleRemoveFriend(u)}
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
                                    <View style={styles.chatButton}>
                                        <Text style={styles.chatButtonText}>CHAT</Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    ) : (
                        <View style={styles.emptyState}>
                            <UserPlus size={48} color="#ccc" />
                            <Text style={styles.emptyText}>
                                No friends yet. Search and add some!
                            </Text>
                            <Text style={styles.emptyHint}>
                                Use the search above to find learning partners
                            </Text>
                        </View>
                    )}
                </View>
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
    // New styles for updated Friends screen
    sectionCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 12,
    },
    searchResultAvatar: {
        backgroundColor: '#2196F3',
    },
    addFriendButton: {
        backgroundColor: '#4CAF50',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 6,
    },
    addFriendButtonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    alreadyFriendBadge: {
        backgroundColor: '#e8f5e9',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
    },
    alreadyFriendText: {
        color: '#4CAF50',
        fontSize: 12,
        fontWeight: '600',
    },
    chatButton: {
        backgroundColor: '#7cc950',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 6,
    },
    chatButtonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    emptyHint: {
        fontSize: 13,
        color: '#aaa',
        textAlign: 'center',
        marginTop: 5,
    },
});
