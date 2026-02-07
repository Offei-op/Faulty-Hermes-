import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebase';

// Mock Data
const LEARNING_PARTNERS = [
    { id: '1', name: 'Henry', lang: 'Spanish' },
    { id: '2', name: 'hendrix_llouchi', lang: 'French' },
    { id: '3', name: 'elinam', lang: 'German' },
];

export default function HomeScreen() {
    const { user, userProfile } = useAuth();
    const streak = userProfile?.learningProgress?.streak || 0;

    const handleLogout = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.brand}>FAULTYHERMES</Text>
                <View style={styles.headerRight}>
                    <Text style={styles.headerLink}>DASHBOARD</Text>
                    <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                        <Text style={styles.logoutText}>LOGOUT</Text>
                    </TouchableOpacity>
                </View>
            </View>

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
                        {/* Learning Partners Card */}
                        <View style={styles.card}>
                            <Text style={styles.cardTitle}>Your Learning Partners</Text>
                            {LEARNING_PARTNERS.map(partner => (
                                <View key={partner.id} style={styles.partnerItem}>
                                    <View style={styles.avatar}>
                                        <Text style={styles.avatarText}>{partner.name[0].toUpperCase()}</Text>
                                    </View>
                                    <View style={styles.partnerInfo}>
                                        <Text style={styles.partnerName}>{partner.name}</Text>
                                        <Text style={styles.partnerLang}>Practicing {partner.lang}</Text>
                                    </View>
                                    <TouchableOpacity style={styles.chatButton}>
                                        <Text style={styles.chatButtonText}>CHAT</Text>
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>

                        {/* Find Partner Card */}
                        <View style={styles.card}>
                            <Text style={styles.cardTitle}>Find a New Partner</Text>
                            <View style={styles.searchRow}>
                                <View style={styles.searchInput}>
                                    <Text style={styles.searchPlaceholder}>Search by username...</Text>
                                </View>
                                <TouchableOpacity style={styles.addButton}>
                                    <Text style={styles.addButtonText}>ADD FRIEND</Text>
                                </TouchableOpacity>
                            </View>
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
        backgroundColor: '#1a2a3a',
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderBottomWidth: 3,
        borderBottomColor: '#7cc950',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    brand: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#7cc950',
        letterSpacing: 1,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerLink: {
        color: '#fff',
        fontSize: 12,
        marginRight: 15,
        fontWeight: '600',
    },
    logoutButton: {
        backgroundColor: '#7cc950',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 5,
    },
    logoutText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    mainContent: {
        padding: 20,
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
    searchRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    searchInput: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        padding: 12,
        marginRight: 10,
    },
    searchPlaceholder: {
        color: '#999',
        fontSize: 14,
    },
    addButton: {
        backgroundColor: '#7cc950',
        paddingHorizontal: 18,
        paddingVertical: 12,
        borderRadius: 5,
    },
    addButtonText: {
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
});
