import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, StyleSheet, Text } from 'react-native';
import { Home, MessageSquare, Users, Settings } from 'lucide-react-native';

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
                tabBarActiveTintColor: '#7cc950', // Green accent
                tabBarInactiveTintColor: '#999',
                tabBarShowLabel: true,
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
        backgroundColor: '#fff',
        borderTopColor: '#eee',
        borderTopWidth: 1,
        height: 60,
        paddingBottom: 5,
        paddingTop: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 10,
    },
});
