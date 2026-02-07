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
                    <Text style={styles.title}>Select Your Languages</Text>
                    <Text style={styles.subtitle}>Let's personalize your learning experience</Text>

                    <Text style={styles.sectionTitle}>I speak:</Text>
                    <View style={styles.optionsContainer}>
                        {languages.map(lang => (
                            <LanguageButton
                                key={`native-${lang}`}
                                lang={lang}
                                selected={nativeLanguage === lang}
                                onSelect={setNativeLanguage}
                            />
                        ))}
                    </View>

                    <Text style={styles.sectionTitle}>I want to learn:</Text>
                    <View style={styles.optionsContainer}>
                        {languages.map(lang => (
                            <LanguageButton
                                key={`target-${lang}`}
                                lang={lang}
                                selected={targetLanguage === lang}
                                onSelect={setTargetLanguage}
                            />
                        ))}
                    </View>

                    <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={loading}>
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.saveButtonText}>START LEARNING</Text>
                        )}
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
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 25,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginTop: 15,
        marginBottom: 12,
    },
    optionsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 10,
    },
    option: {
        paddingVertical: 10,
        paddingHorizontal: 18,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#ddd',
        margin: 4,
        backgroundColor: '#fff',
    },
    optionSelected: {
        backgroundColor: '#7cc950',
        borderColor: '#7cc950',
    },
    optionText: {
        color: '#333',
        fontSize: 14,
    },
    optionTextSelected: {
        color: '#fff',
        fontWeight: 'bold',
    },
    saveButton: {
        backgroundColor: '#7cc950',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 25,
    },
    saveButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
        letterSpacing: 1,
    },
});
