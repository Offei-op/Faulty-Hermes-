import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebase';
import { useAuth } from '../context/AuthContext';

export default function DashboardScreen() {
    const { user, userProfile } = useAuth();

    const handleSignOut = async () => {
        try {
            await signOut(auth);
        } catch (error: any) {
            console.error('Sign out error:', error.message);
        }
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.brand}>FAULTYHERMES</Text>
            </View>

            <View style={styles.content}>
                <Text style={styles.title}>Dashboard</Text>

                <View style={styles.profileCard}>
                    <Text style={styles.greeting}>
                        Welcome, {userProfile?.displayName || user?.email}!
                    </Text>

                    {userProfile && (
                        <View style={styles.languageInfo}>
                            <Text style={styles.languageText}>
                                Native: {userProfile.nativeLanguage}
                            </Text>
                            <Text style={styles.languageText}>
                                Learning: {userProfile.targetLanguage}
                            </Text>
                        </View>
                    )}
                </View>

                <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
                    <Text style={styles.signOutText}>SIGN OUT</Text>
                </TouchableOpacity>
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
        paddingVertical: 20,
        paddingHorizontal: 20,
        borderBottomWidth: 3,
        borderBottomColor: '#7cc950',
    },
    brand: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#7cc950',
        letterSpacing: 1,
    },
    content: {
        flex: 1,
        padding: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 20,
    },
    profileCard: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        marginBottom: 20,
    },
    greeting: {
        fontSize: 18,
        color: '#333',
        fontWeight: '600',
        marginBottom: 15,
    },
    languageInfo: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    languageText: {
        fontSize: 16,
        color: '#666',
        backgroundColor: '#f0f0f0',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
    },
    signOutButton: {
        backgroundColor: '#e74c3c',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
    },
    signOutText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
        letterSpacing: 1,
    },
});
