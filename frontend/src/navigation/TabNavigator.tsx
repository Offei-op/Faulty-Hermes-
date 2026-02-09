import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, StyleSheet, Text, Platform } from 'react-native';
import { Home, MessageSquare, Users, Settings } from 'lucide-react-native';
import { BlurView } from 'expo-blur';

// Screens
import HomeScreen from '../dashboard/HomeScreen';
import ChatListScreen from '../chat/ChatListScreen';
import FriendsScreen from '../social/FriendsScreen';
import SettingsScreen from '../settings/SettingsScreen';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarStyle: styles.tabBar,
                tabBarActiveTintColor: '#7cc950',
                tabBarInactiveTintColor: '#888',
                tabBarShowLabel: true,
                tabBarBackground: () => (
                    <BlurView intensity={10} tint="dark" style={StyleSheet.absoluteFill} />
                ),
            }}
        >
            <Tab.Screen
                name="Dashboard"
                component={HomeScreen}
                options={{
                    tabBarIcon: ({ color, size }: { color: string; size: number }) => <Home color={color} size={size} />,
                    title: 'Home',
                }}
            />

            <Tab.Screen
                name="Chats"
                component={ChatListScreen}
                options={{
                    tabBarIcon: ({ color, size }: { color: string; size: number }) => <MessageSquare color={color} size={size} />,
                }}
            />

            <Tab.Screen
                name="Friends"
                component={FriendsScreen}
                options={{
                    tabBarIcon: ({ color, size }: { color: string; size: number }) => <Users color={color} size={size} />,
                }}
            />

            <Tab.Screen
                name="Settings"
                component={SettingsScreen}
                options={{
                    tabBarIcon: ({ color, size }: { color: string; size: number }) => <Settings color={color} size={size} />,
                }}
            />
        </Tab.Navigator>
    );
}

const styles = StyleSheet.create({
    tabBar: {
        position: 'absolute',
        bottom: 25, // Push up
        left: 50,   // Add side spacing
        right: 50,  // Add side spacing
        backgroundColor: 'transparent',
        borderTopWidth: 0,
        elevation: 10, // Add shadow for floating effect
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        height: 65,
        paddingBottom: 0, // Reset padding
        paddingTop: 0,
        borderRadius: 35, // Round edges
        overflow: 'hidden', // Clip the blur view
    },
});
