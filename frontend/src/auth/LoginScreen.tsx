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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { useEffect } from 'react';
import { Mail, Lock } from 'lucide-react-native';
import { BlurView } from 'expo-blur';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
    const navigation = useNavigation<any>();
    const { loginAsGuest } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const insets = useSafeAreaInsets();

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

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please enter email and password');
            return;
        }

        setLoading(true);
        try {
            await signInWithEmailAndPassword(auth, email, password);
            // Navigation handled automatically by AuthContext
        } catch (error: any) {
            Alert.alert('Login Failed', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            {/* Header with Glassmorphism - Fixed Position */}
            <BlurView intensity={10} tint="dark" style={styles.header}>
                <View style={styles.headerContent}>
                    <Text style={styles.brand}>FAULTYHERMES</Text>
                </View>
            </BlurView>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >

                {/* Card */}
                <View style={styles.card}>
                    <Text style={styles.title}>Welcome back!</Text>

                    <Text style={styles.label}>Username:</Text>
                    <View style={styles.inputContainer}>
                        <Mail color="#999" size={20} />
                        <TextInput
                            style={styles.input}
                            placeholder="Enter your email"
                            placeholderTextColor="#999"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                    </View>

                    <Text style={styles.label}>Password:</Text>
                    <View style={styles.inputContainer}>
                        <Lock color="#999" size={20} />
                        <TextInput
                            style={styles.input}
                            placeholder="Enter your password"
                            placeholderTextColor="#999"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />
                    </View>

                    <TouchableOpacity
                        style={styles.button}
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>LOGIN</Text>
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

                    <Text style={styles.linkLabel}>New to FaultyHermes?</Text>
                    <TouchableOpacity
                        style={styles.secondaryButton}
                        onPress={() => navigation.navigate('Signup')}
                    >
                        <Text style={styles.secondaryButtonText}>CREATE AN ACCOUNT</Text>
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
        justifyContent: 'center',
        paddingTop: 130, // Space for floating header
        paddingBottom: 30,
    },
    header: {
        position: 'absolute',
        top: 100,
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
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 15,
    },
    brand: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#7cc950',
        letterSpacing: 1,
    },
    card: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        marginHorizontal: 20, // Reduced margin for wider card
        marginVertical: 20,
        padding: 35, // Increased padding for spaciousness
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
        marginBottom: 30,
    },
    label: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
        marginBottom: 20,
        paddingHorizontal: 12,
    },
    input: {
        flex: 1,
        color: '#333',
        paddingVertical: 12,
        paddingHorizontal: 10,
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
        marginVertical: 25,
    },
    linkLabel: {
        color: '#666',
        textAlign: 'center',
        marginBottom: 15,
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
