import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

export interface UserProfile {
    uid: string;
    email: string;
    displayName: string;
    nativeLanguage: string;
    targetLanguage: string;
    friends: string[];
    learningProgress: { streak: number; wordsLearned: number };
}

interface AuthContextType {
    user: User | null | any;
    userProfile: UserProfile | null;
    loading: boolean;
    loginAsGuest: () => void;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    userProfile: null,
    loading: true,
    loginAsGuest: () => { }
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null | any>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    const loginAsGuest = () => {
        setLoading(true);
        const mockUser = {
            uid: 'guest-123',
            email: 'guest@faultyhermes.com',
            displayName: 'Guest User',
        };
        const mockProfile: UserProfile = {
            uid: 'guest-123',
            email: 'guest@faultyhermes.com',
            displayName: 'Guest User',
            nativeLanguage: 'English',
            targetLanguage: 'Spanish',
            friends: [],
            learningProgress: { streak: 5, wordsLearned: 150 }
        };
        setUser(mockUser);
        setUserProfile(mockProfile);
        setLoading(false);
    };

    useEffect(() => {
        let unsubscribeSnapshot: (() => void) | undefined;

        const unsubscribeAuth = onAuthStateChanged(auth, (usr) => {
            if (user && user.uid === 'guest-123') return; // Don't override guest session

            setUser(usr);
            if (usr) {
                // User logged in - fetch their profile from Firestore
                setLoading(true);
                const userDocRef = doc(db, 'users', usr.uid);

                unsubscribeSnapshot = onSnapshot(
                    userDocRef,
                    (docSnap) => {
                        if (docSnap.exists()) {
                            setUserProfile(docSnap.data() as UserProfile);
                        } else {
                            console.log('No user profile found for', usr.uid);
                            setUserProfile(null);
                        }
                        setLoading(false);
                    },
                    (error) => {
                        console.error('Error fetching user profile:', error);
                        setLoading(false);
                    }
                );
            } else {
                // User logged out
                setUserProfile(null);
                setLoading(false);
                if (unsubscribeSnapshot) {
                    unsubscribeSnapshot();
                }
            }
        });

        return () => {
            unsubscribeAuth();
            if (unsubscribeSnapshot) {
                unsubscribeSnapshot();
            }
        };
    }, [user]);

    return (
        <AuthContext.Provider value={{ user, userProfile, loading, loginAsGuest }}>
            {children}
        </AuthContext.Provider>
    );
};
