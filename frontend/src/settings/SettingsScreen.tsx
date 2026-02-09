import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, ScrollView } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { auth } from '../config/firebase';
import { signOut } from 'firebase/auth';
import { LogOut, Globe, MessageCircle, User } from 'lucide-react-native';
import { BlurView } from 'expo-blur';

export default function SettingsScreen() {
    const { user, userProfile } = useAuth();
    const [shadowBubble, setShadowBubble] = useState(true);

    const handleLogout = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    return (
        <View style={styles.container}>
            {/* Header - Fixed Position */}
            <BlurView intensity={30} tint="dark" style={styles.header}>
                <View style={styles.headerContent}>
                    <Text style={styles.brand}>FAULTYHERMES</Text>
                </View>
            </BlurView>

            <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
                <Text style={styles.pageTitle}>Settings</Text>

                {/* Profile Section */}
                <View style={styles.profileCard}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{user?.displayName?.[0]?.toUpperCase() || 'U'}</Text>
                    </View>
                    <Text style={styles.name}>{userProfile?.displayName || user?.displayName || 'User'}</Text>
                    <Text style={styles.email}>{user?.email}</Text>
                    <Text style={styles.language}>Learning: {userProfile?.targetLanguage || 'Not set'}</Text>
                </View>

                {/* Preferences Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>Preferences</Text>

                    <View style={styles.settingItem}>
                        <View style={styles.settingInfo}>
                            <MessageCircle size={22} color="#7cc950" />
                            <Text style={styles.settingLabel}>Shadow Bubble</Text>
                        </View>
                        <Switch
                            value={shadowBubble}
                            onValueChange={setShadowBubble}
                            trackColor={{ false: '#ddd', true: '#7cc950' }}
                            thumbColor={shadowBubble ? '#fff' : '#f4f3f4'}
                        />
                    </View>

                    <TouchableOpacity style={styles.settingItem}>
                        <View style={styles.settingInfo}>
                            <Globe size={22} color="#7cc950" />
                            <Text style={styles.settingLabel}>Change Target Language</Text>
                        </View>
                        <Text style={styles.chevron}>{'>'}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.settingItem}>
                        <View style={styles.settingInfo}>
                            <User size={22} color="#7cc950" />
                            <Text style={styles.settingLabel}>Edit Profile</Text>
                        </View>
                        <Text style={styles.chevron}>{'>'}</Text>
                    </TouchableOpacity>
                </View>

                {/* Account Actions */}
                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>Account</Text>
                    <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                        <LogOut size={20} color="#e74c3c" />
                        <Text style={styles.logoutText}>Sign Out</Text>
                    </TouchableOpacity>
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
    profileCard: {
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 25,
        marginBottom: 25,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#7cc950',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
    },
    avatarText: {
        fontSize: 32,
        color: '#fff',
        fontWeight: 'bold',
    },
    name: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
    },
    email: {
        fontSize: 14,
        color: '#666',
        marginBottom: 5,
    },
    language: {
        fontSize: 13,
        color: '#7cc950',
        fontWeight: '500',
    },
    section: {
        marginBottom: 25,
    },
    sectionHeader: {
        fontSize: 12,
        color: '#888',
        textTransform: 'uppercase',
        marginBottom: 10,
        letterSpacing: 1,
        fontWeight: '600',
    },
    settingItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 12,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 2,
        elevation: 1,
    },
    settingInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    settingLabel: {
        fontSize: 15,
        color: '#333',
    },
    chevron: {
        color: '#ccc',
        fontSize: 18,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 12,
        gap: 10,
        borderWidth: 1,
        borderColor: '#fde4e4',
    },
    logoutText: {
        color: '#e74c3c',
        fontSize: 16,
        fontWeight: '600',
    },
});
