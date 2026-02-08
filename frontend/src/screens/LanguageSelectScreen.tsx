import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    ScrollView,
    Platform
} from 'react-native';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';

export default function LanguageSelectScreen() {
    const { user } = useAuth();
    const [nativeLanguage, setNativeLanguage] = useState('English');
    const [targetLanguage, setTargetLanguage] = useState('Spanish');
    const [loading, setLoading] = useState(false);

    const languages = ['English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese'];

    const handleSave = async () => {
        if (!user) return;
        setLoading(true);
        try {
            await setDoc(doc(db, 'users', user.uid), {
                nativeLanguage,
                targetLanguage,
            }, { merge: true });
            // Once updated, the AuthContext listener in App.tsx will navigate to MainTabs
        } catch (error: any) {
            Alert.alert('Error', 'Failed to save languages: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const LanguageButton = ({ lang, selected, onSelect }: { lang: string, selected: boolean, onSelect: (l: string) => void }) => (
        <TouchableOpacity
            style={[styles.option, selected && styles.optionSelected]}
            onPress={() => onSelect(lang)}
        >
            <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{lang}</Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.brand}>FAULTYHERMES</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.card}>
                    <Text style={styles.title}>Select Your Languages</Text>
                    <Text style={styles.subtitle}>Let's personalize your learning experience</Text>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>I speak:</Text>
                        <View style={styles.optionsGrid}>
                            {languages.map(lang => (
                                <LanguageButton
                                    key={`native-${lang}`}
                                    lang={lang}
                                    selected={nativeLanguage === lang}
                                    onSelect={setNativeLanguage}
                                />
                            ))}
                        </View>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>I want to learn:</Text>
                        <View style={styles.optionsGrid}>
                            {languages.map(lang => (
                                <LanguageButton
                                    key={`target-${lang}`}
                                    lang={lang}
                                    selected={targetLanguage === lang}
                                    onSelect={setTargetLanguage}
                                />
                            ))}
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.saveButton, loading && styles.buttonDisabled]}
                        onPress={handleSave}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.saveButtonText}>START LEARNING</Text>
                        )}
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
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 20,
    },
    card: {
        backgroundColor: '#fff',
        padding: 30,
        borderRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 15,
        color: '#666',
        textAlign: 'center',
        marginBottom: 35,
    },
    section: {
        marginBottom: 25,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
    },
    optionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -5,
    },
    option: {
        paddingVertical: 12,
        paddingHorizontal: 22,
        borderRadius: 25,
        borderWidth: 1,
        borderColor: '#eee',
        margin: 5,
        backgroundColor: '#fff',
    },
    optionSelected: {
        backgroundColor: '#86cc52',
        borderColor: '#86cc52',
    },
    optionText: {
        color: '#666',
        fontSize: 15,
        fontWeight: '500',
    },
    optionTextSelected: {
        color: '#fff',
        fontWeight: 'bold',
    },
    saveButton: {
        backgroundColor: '#86cc52',
        padding: 18,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 30,
        shadowColor: '#86cc52',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    saveButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 18,
        letterSpacing: 1.5,
    },
});
