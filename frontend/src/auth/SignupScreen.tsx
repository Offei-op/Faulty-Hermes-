import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    ScrollView,
    Platform
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { createUserWithEmailAndPassword, updateProfile, GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { useEffect } from 'react';

WebBrowser.maybeCompleteAuthSession();

export default function SignupScreen() {
    const navigation = useNavigation<any>();
    const { loginAsGuest } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [loading, setLoading] = useState(false);

    // Check if Google auth is configured
    const hasGoogleConfig = !!(
        process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
        process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ||
        process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID
    );

    // Google Auth Request - provide placeholders to prevent errors
    const [request, response, promptAsync] = Google.useAuthRequest({
        iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || 'placeholder-ios.apps.googleusercontent.com',
        androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || 'placeholder-android.apps.googleusercontent.com',
        webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || 'placeholder-web.apps.googleusercontent.com',
    });

    useEffect(() => {
        if (response?.type === 'success' && hasGoogleConfig) {
            const { id_token } = response.params;
            const credential = GoogleAuthProvider.credential(id_token);
            setLoading(true);
            signInWithCredential(auth, credential)
                .catch(error => Alert.alert('Google Sign-In Error', error.message))
                .finally(() => setLoading(false));
        }
    }, [response]);

    const handleSignup = async () => {
        if (!displayName || !email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setLoading(true);
        try {
            // 1. Create Firebase Auth user
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await updateProfile(userCredential.user, { displayName });

            // 2. Create Firestore user profile document
            await setDoc(doc(db, 'users', userCredential.user.uid), {
                uid: userCredential.user.uid,
                email,
                displayName,
                nativeLanguage: '',
                targetLanguage: '',
                friends: [],
                learningProgress: { streak: 0, wordsLearned: 0 }
            });
            // Navigation handled automatically by AuthContext
        } catch (error: any) {
            Alert.alert('Signup Failed', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.brand}>FAULTYHERMES</Text>
                </View>

                {/* Card */}
                <View style={styles.card}>
                    <Text style={styles.title}>Create Account</Text>

                    <Text style={styles.label}>Display Name:</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Your name"
                        placeholderTextColor="#999"
                        value={displayName}
                        onChangeText={setDisplayName}
                    />

                    <Text style={styles.label}>Email:</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="your@email.com"
                        placeholderTextColor="#999"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                    />

                    <Text style={styles.label}>Password:</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Create a password"
                        placeholderTextColor="#999"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />

                    <TouchableOpacity
                        style={styles.button}
                        onPress={handleSignup}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>SIGN UP</Text>
                        )}
                    </TouchableOpacity>

                    <View style={styles.divider} />

                    {hasGoogleConfig && (
                        <>
                            <TouchableOpacity
                                style={styles.googleButton}
                                onPress={() => promptAsync()}
                                disabled={!request || loading}
                            >
                                <View style={styles.googleIconContainer}>
                                    <Text style={styles.googleIconText}>G</Text>
                                </View>
                                <Text style={styles.googleButtonText}>Continue with Google</Text>
                            </TouchableOpacity>

                            <View style={styles.divider} />
                        </>
                    )}

                    <Text style={styles.linkLabel}>Already have an account?</Text>
                    <TouchableOpacity
                        style={styles.secondaryButton}
                        onPress={() => navigation.navigate('Login')}
                    >
                        <Text style={styles.secondaryButtonText}>SIGN IN</Text>
                    </TouchableOpacity>
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
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 30,
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
    card: {
        backgroundColor: '#fff',
        margin: 20,
        marginTop: 30,
        padding: 25,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
        marginBottom: 25,
    },
    label: {
        fontSize: 14,
        color: '#666',
        marginBottom: 6,
    },
    input: {
        backgroundColor: '#fff',
        color: '#333',
        borderRadius: 8,
        padding: 14,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#ddd',
        fontSize: 16,
    },
    button: {
        backgroundColor: '#7cc950',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 10,
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
        letterSpacing: 1,
    },
    divider: {
        height: 1,
        backgroundColor: '#eee',
        marginVertical: 20,
    },
    linkLabel: {
        color: '#666',
        textAlign: 'center',
        marginBottom: 12,
        fontSize: 14,
    },
    secondaryButton: {
        backgroundColor: '#3bb5e8',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
    },
    secondaryButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
        letterSpacing: 1,
    },
    googleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
        marginTop: 5,
    },
    googleIconContainer: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#4285F4',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    googleIconText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 18,
    },
    googleButtonText: {
        color: '#555',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
