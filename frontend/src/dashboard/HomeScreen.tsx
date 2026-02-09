import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Alert } from 'react-native';
import { BlurView } from 'expo-blur';
import { useAuth } from '../context/AuthContext';
import { signOut } from 'firebase/auth';
import { auth, db } from '../config/firebase';
import { collection, onSnapshot, query, limit, where, getDocs, doc, setDoc, deleteDoc, orderBy, Timestamp } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';

export default function HomeScreen() {
    const { user, userProfile } = useAuth();
    const navigation = useNavigation<any>();
    const streak = userProfile?.learningProgress?.streak || 0;

    // State for different sections
    const [friends, setFriends] = useState<any[]>([]);
    const [newUsers, setNewUsers] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searching, setSearching] = useState(false);
    const [loading, setLoading] = useState(true);

    // Fetch FRIENDS (users I've added)
    useEffect(() => {
        if (!user) return;

        // Listen to my friends subcollection
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

    // Fetch NEW USERS (joined in last 24 hours)
    useEffect(() => {
        if (!user) return;

        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);

        const newUsersQuery = query(
            collection(db, 'users'),
            where('createdAt', '>=', Timestamp.fromDate(oneDayAgo)),
            orderBy('createdAt', 'desc'),
            limit(5)
        );

        const unsubscribe = onSnapshot(newUsersQuery, (snapshot) => {
            const users = snapshot.docs
                .map(doc => doc.data())
                .filter(u => u.uid !== user.uid); // Exclude self
            setNewUsers(users);
        });

        return () => unsubscribe();
    }, [user]);

    // Search for users by name
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
                .slice(0, 5);

            setSearchResults(results);
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setSearching(false);
        }
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

            Alert.alert('Success!', `${friendUser.displayName} added as a learning partner!`);
            setSearchResults([]);
            setSearchQuery('');
        } catch (error) {
            console.error('Add friend error:', error);
            Alert.alert('Error', 'Could not add friend. Please try again.');
        }
    };

    // Generate chatId by sorting UIDs alphabetically
    const getChatId = (otherUserId: string) => {
        const ids = [user!.uid, otherUserId].sort();
        return ids.join('_');
    };

    // Navigate to Chat screen
    const handleChatPress = (otherUser: any) => {
        const chatId = getChatId(otherUser.uid);
        navigation.navigate('Chat', { chatId, otherUser });
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    return (
        <View style={styles.container}>
            {/* Glassmorphism Header with Brand Logo - Fixed Position */}
            <BlurView intensity={10} tint="dark" style={styles.header}>
                <View style={styles.headerContent}>
                    <Text style={styles.brand}>FAULTYHERMES</Text>
                </View>
            </BlurView>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Main Content */}
                <View style={styles.mainContent}>
                    {/* Welcome Section */}
                    <View style={styles.welcomeSection}>
                        <Text style={styles.welcomeTitle}>Welcome back, {userProfile?.displayName || user?.displayName || 'Traveler'}!</Text>
                        <Text style={styles.welcomeSubtitle}>Pick up where you left off or find a new partner.</Text>
                    </View>

                    <View style={styles.columnsContainer}>
                        {/* Left Column */}
                        <View style={styles.leftColumn}>
                            {/* New Users Notification Card */}
                            {newUsers.length > 0 && (
                                <View style={[styles.card, styles.notificationCard]}>
                                    <View style={styles.notificationHeader}>
                                        <Text style={styles.cardTitle}>🆕 New Users Joined!</Text>
                                        <View style={styles.badge}>
                                            <Text style={styles.badgeText}>{newUsers.length}</Text>
                                        </View>
                                    </View>
                                    {newUsers.map(newUser => (
                                        <View key={newUser.uid} style={styles.partnerItem}>
                                            <View style={[styles.avatar, styles.newUserAvatar]}>
                                                <Text style={styles.avatarText}>{newUser.displayName?.[0]?.toUpperCase() || '?'}</Text>
                                            </View>
                                            <View style={styles.partnerInfo}>
                                                <Text style={styles.partnerName}>{newUser.displayName || 'Unknown'}</Text>
                                                <Text style={styles.partnerLang}>Learning {newUser.targetLanguage || 'N/A'}</Text>
                                            </View>
                                            <TouchableOpacity
                                                style={[styles.chatButton, styles.addFriendButton]}
                                                onPress={() => handleAddFriend(newUser)}
                                            >
                                                <Text style={styles.chatButtonText}>+ ADD</Text>
                                            </TouchableOpacity>
                                        </View>
                                    ))}
                                </View>
                            )}

                            {/* Learning Partners Card */}
                            <View style={styles.card}>
                                <Text style={styles.cardTitle}>Your Learning Partners</Text>
                                {loading ? (
                                    <View style={styles.loadingContainer}>
                                        <ActivityIndicator size="small" color="#7cc950" />
                                    </View>
                                ) : friends.length > 0 ? (
                                    friends.map((partner: any) => (
                                        <View key={partner.uid} style={styles.partnerItem}>
                                            <View style={styles.avatar}>
                                                <Text style={styles.avatarText}>{partner.displayName?.[0]?.toUpperCase() || '?'}</Text>
                                            </View>
                                            <View style={styles.partnerInfo}>
                                                <Text style={styles.partnerName}>{partner.displayName || 'Unknown'}</Text>
                                                <Text style={styles.partnerLang}>Practicing {partner.targetLanguage || 'N/A'}</Text>
                                            </View>
                                            <TouchableOpacity style={styles.chatButton} onPress={() => handleChatPress(partner)}>
                                                <Text style={styles.chatButtonText}>CHAT</Text>
                                            </TouchableOpacity>
                                        </View>
                                    ))
                                ) : (
                                    <Text style={styles.emptyPartnersText}>
                                        No partners yet. Search and add friends below!
                                    </Text>
                                )}
                            </View>

                            {/* Find Partner Card */}
                            <View style={styles.card}>
                                <Text style={styles.cardTitle}>Find a New Partner</Text>
                                <View style={styles.searchRow}>
                                    <TextInput
                                        style={styles.searchInputField}
                                        placeholder="Search by username..."
                                        placeholderTextColor="#999"
                                        value={searchQuery}
                                        onChangeText={setSearchQuery}
                                        onSubmitEditing={handleSearch}
                                        returnKeyType="search"
                                    />
                                    <TouchableOpacity
                                        style={[styles.addButton, searching && { opacity: 0.7 }]}
                                        onPress={handleSearch}
                                        disabled={searching}
                                    >
                                        {searching ? (
                                            <ActivityIndicator size="small" color="#fff" />
                                        ) : (
                                            <Text style={styles.addButtonText}>SEARCH</Text>
                                        )}
                                    </TouchableOpacity>
                                </View>

                                {/* Search Results */}
                                {searchResults.length > 0 && (
                                    <View style={styles.searchResults}>
                                        {searchResults.map(result => (
                                            <View key={result.uid} style={styles.partnerItem}>
                                                <View style={styles.avatar}>
                                                    <Text style={styles.avatarText}>{result.displayName?.[0]?.toUpperCase() || '?'}</Text>
                                                </View>
                                                <View style={styles.partnerInfo}>
                                                    <Text style={styles.partnerName}>{result.displayName}</Text>
                                                    <Text style={styles.partnerLang}>Learning {result.targetLanguage || 'N/A'}</Text>
                                                </View>
                                                <TouchableOpacity
                                                    style={[styles.chatButton, styles.addFriendButton]}
                                                    onPress={() => handleAddFriend(result)}
                                                >
                                                    <Text style={styles.chatButtonText}>+ ADD</Text>
                                                </TouchableOpacity>
                                            </View>
                                        ))}
                                    </View>
                                )}
                            </View>
                        </View>

                        {/* Right Column */}
                        <View style={styles.rightColumn}>
                            {/* Profile Card */}
                            <View style={styles.profileCard}>
                                <View style={styles.profileAvatar}>
                                    <Text style={styles.profileAvatarText}>
                                        {(userProfile?.displayName || user?.displayName || 'U')[0].toUpperCase()}
                                    </Text>
                                </View>
                                <Text style={styles.profileName}>{userProfile?.displayName || user?.displayName || 'User'}</Text>
                                <Text style={styles.profileLanguage}>Target: {userProfile?.targetLanguage || 'Not set'}</Text>
                            </View>

                            {/* Streak Card */}
                            <View style={styles.streakCard}>
                                <Text style={styles.streakLabel}>STREAK</Text>
                                <View style={styles.streakRow}>
                                    <Text style={styles.streakEmoji}>🔥</Text>
                                    <Text style={styles.streakCount}>{streak} Days</Text>
                                </View>
                            </View>

                            {/* Achievements Card */}
                            <View style={styles.card}>
                                <View style={styles.achievementHeader}>
                                    <Text style={styles.achievementEmoji}>🏆</Text>
                                    <Text style={styles.achievementTitle}>Achievements</Text>
                                </View>
                                <View style={styles.achievementItem}>
                                    <Text style={styles.achievementStar}>⭐</Text>
                                    <Text style={styles.achievementName}>First Conversation</Text>
                                </View>
                                <View style={styles.achievementProgress}>
                                    <View style={styles.achievementProgressBar} />
                                </View>
                            </View>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    content: {
        flexGrow: 1,
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
    mainContent: {
        padding: 20,
        marginTop: 120,
    },
    welcomeSection: {
        marginBottom: 25,
    },
    welcomeTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
    },
    welcomeSubtitle: {
        fontSize: 14,
        color: '#666',
    },
    columnsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    leftColumn: {
        flex: 2,
        minWidth: 280,
        marginRight: 15,
    },
    rightColumn: {
        flex: 1,
        minWidth: 200,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
    },
    loadingContainer: {
        padding: 20,
        alignItems: 'center',
    },
    emptyPartnersText: {
        color: '#999',
        fontSize: 14,
        textAlign: 'center',
        paddingVertical: 20,
    },
    partnerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#eee',
        borderRadius: 10,
        padding: 12,
        marginBottom: 10,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#3bb5e8',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    avatarText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    partnerInfo: {
        flex: 1,
    },
    partnerName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    partnerLang: {
        fontSize: 12,
        color: '#888',
    },
    chatButton: {
        backgroundColor: '#3bb5e8',
        paddingHorizontal: 18,
        paddingVertical: 8,
        borderRadius: 5,
    },
    chatButtonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    profileCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        marginBottom: 15,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    profileAvatar: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#7cc950',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    profileAvatarText: {
        color: '#fff',
        fontSize: 28,
        fontWeight: 'bold',
    },
    profileName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
    },
    profileLanguage: {
        fontSize: 13,
        color: '#666',
    },
    streakCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#eee',
    },
    streakLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#7cc950',
        marginBottom: 8,
        letterSpacing: 1,
    },
    streakRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    streakEmoji: {
        fontSize: 24,
        marginRight: 10,
    },
    streakCount: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    achievementHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    achievementEmoji: {
        fontSize: 20,
        marginRight: 8,
    },
    achievementTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    achievementItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    achievementStar: {
        fontSize: 16,
        marginRight: 8,
    },
    achievementName: {
        fontSize: 14,
        color: '#333',
    },
    achievementProgress: {
        height: 6,
        backgroundColor: '#eee',
        borderRadius: 3,
        marginTop: 5,
    },
    achievementProgressBar: {
        width: '70%',
        height: 6,
        backgroundColor: '#7cc950',
        borderRadius: 3,
    },
    // Added missing styles for Find Partner Card
    searchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
    },
    searchInput: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        paddingHorizontal: 15,
        height: 40,
        justifyContent: 'center',
        marginRight: 10,
    },
    searchPlaceholder: {
        color: '#999',
        fontSize: 14,
    },
    addButton: {
        backgroundColor: '#7cc950',
        paddingHorizontal: 15,
        height: 40,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    addButtonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    // New Users Notification Styles
    notificationCard: {
        borderLeftWidth: 4,
        borderLeftColor: '#ff9800',
        backgroundColor: '#fff9e6',
    },
    notificationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    badge: {
        backgroundColor: '#ff9800',
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 2,
    },
    badgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    newUserAvatar: {
        backgroundColor: '#ff9800',
    },
    addFriendButton: {
        backgroundColor: '#4CAF50',
    },
    // Search Input Field (actual TextInput)
    searchInputField: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        paddingHorizontal: 15,
        height: 40,
        marginRight: 10,
        fontSize: 14,
        color: '#333',
    },
    searchResults: {
        marginTop: 15,
        paddingTop: 15,
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
});
