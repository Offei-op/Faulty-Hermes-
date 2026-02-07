import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    ScrollView,
    Platform
} from 'react-native';
import { Search, UserPlus } from 'lucide-react-native';

export default function FriendsScreen() {
    const [searchQuery, setSearchQuery] = useState('');

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.brand}>FAULTYHERMES</Text>
            </View>

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

                <View style={styles.emptyState}>
                    <UserPlus size={64} color="#ccc" />
                    <Text style={styles.emptyText}>Search for people to start learning together!</Text>
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
        flexGrow: 1,
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
});
