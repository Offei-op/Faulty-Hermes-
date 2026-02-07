Faulty Hermes 
Real-Time Translation & Language Learning Messaging App 
(Technical Documentation & Project Blueprint) 
1. Project Overview 
Faulty Hermes is a real-time messaging application designed to accelerate 
language learning through live conversation. The platform bridges the gap 
between passive learning methods (like flashcards) and active 
communication by providing real-time translation assistance during chat 
interactions. 
The application introduces an innovative Shadow Bubble reinforcement 
system, allowing users to communicate across languages while 
simultaneously learning their target language through contextual 
feedback. 
2. Vision Statement 
Faulty Hermes transforms language acquisition into a seamless and natural 
experience by: 
• Eliminating communication barriers between users of different 
native languages. 
• Reducing language-learning anxiety through real-time translation 
support. 
• Reinforcing learning through contextual repetition and 
conversation-based practice. 
• Combining structured learning modules with real conversational 
practice. 
3. Core Features 
3.1 Real-Time Peer-to-Peer Translation 
Dual Translation Stream 
• Messages typed in a user’s language are automatically translated 
into the recipient’s target language. 
• Example: 
o David (Learning French) → Sends message in French 
o Jack (Learning Spanish) → Receives translated Spanish version 
Shadow Bubble System 
• Displays a reinforcement translation beneath the user’s own 
message. 
• Helps users understand what they are communicating in their native 
language. 
• Encourages learning through immediate feedback. 
3.2 Pre-Chat Learning Modules (Hermes Primer) 
The Primer acts as preparation before entering conversations. 
Smart Flashcards 
• Uses Spaced Repetition System (SRS). 
• Vocabulary tailored to conversation contexts. 
AI Phrasebook 
• Provides curated conversation starters. 
• Includes audio pronunciation support. 
Grammar Snaps 
• Short visual lessons explaining grammar fundamentals. 
• Designed for quick understanding (≈ 1 minute per lesson). 
3.3 Learning-to-Practice Workflow 
1. Warm-up Phase 
o Users complete flashcard or learning activities. 
2. Matching Phase 
o Connect with friends or language partners. 
3. Active Practice 
o Real-time bilingual messaging with translation assistance. 
4. Review Phase 
o New vocabulary automatically added to user learning deck. 
4. Application Screens & UI/UX Design 
4.1 Authentication & Onboarding 
• Clean, minimalist login/signup interface. 
• User inputs: 
o Email 
o Password 
o Display Name 
• Onboarding collects: 
o Native Language 
o Target Language 
• Data stored in Firestore user profile. 
4.2 Dashboard (Central Hub) 
Features: 
• Progress ring showing daily learning goals. 
• Navigation Tabs: 
o Learning 
o Chats 
o Friends 
o Settings 
• Quick access to flashcards and conversations. 
4.3 Learning Center (Flashcards) 
Interface: 
• Swipe-based card interaction. 
• Fetches vocabulary from Firestore collections. 
Features: 
• Speech-based card flipping using Web Speech API. 
• Learning progress tracking. 
4.4 Friend Management & Social System 
Features: 
• Search users by email or username. 
• Send and receive friend requests. 
• Online/offline presence indicator. 
• Displays friend’s target language. 
4.5 Chat Room (Core Feature) 
Chat Header 
• Displays friend details and language indicators. 
Message Bubble System 
Sent Messages 
• Primary Bubble: Original Message 
• Shadow Bubble: Native-language reinforcement 
Received Messages 
• Primary Bubble: Translated Message 
• Tap-to-Reveal: Sender’s original message 
Input System 
• Text field 
• “Translate & Send” functionality 
4.6 Settings & Profile 
Users can: 
• Change target language. 
• Reset learning progress. 
• Toggle Shadow Bubble feature. 
• Update profile information. 
• Logout. 
5. Technical Architecture 
5.1 Frontend 
Primary Framework: React with TypeScript 
Mobile Framework: Expo (React Native) 
State Management: React Hooks & Context API 
Routing: Expo Router / React Navigation 
Styling: Tailwind CSS (via NativeWind for Expo) 
Animations: React Native Reanimated / Expo Animation Libraries 
Frontend is divided into modular feature directories: 
/auth 
/chat 
/learning 
/social 
/settings 
5.2 Backend (Firebase) 
Authentication 
Firebase Auth 
Email/Password login 
Google Sign-in support 
Database 
Cloud Firestore 
Real-time data synchronization 
Storage 
Firebase Storage for user avatars and media. 
5.3 Intelligence Layer 
Gemini API or Google Cloud Translation API 
Responsible for: 
Real-time translation 
Flashcard generation 
Vocabulary extraction from chats 
6. Component Architecture 
6.1 Hermes Primer (Learning Module) 
Responsibilities: 
• Gate access to daily chat usage. 
• Deliver flashcard learning sessions. 
Components: 
• FlashcardDeck.jsx 
• SwipeCard.jsx 
• ProgressBar.jsx 
6.2 Bilingual Bridge (Chat Module) 
Responsibilities: 
• Real-time bilingual messaging. 
• Translation rendering. 
Components: 
• ChatWindow.jsx 
• MessageBubble.jsx 
• ShadowBubble.jsx 
6.3 Social Ledger (Friend System) 
Responsibilities: 
• Manage friend relationships. 
• Process friend requests. 
Components: 
• FriendSearch.jsx 
• RequestNotification.jsx 
6.4 Settings & Identity Module 
Responsibilities: 
• Language configuration 
• User preferences 
Components: 
• ProfileSettings.jsx 
• LanguagePicker.jsx 
7. Data Models (Firestore) 
7.1 Users Collection 
Path: /users/{uid} 
{ 
"uid": "string", 
"displayName": "string", 
"email": "string", 
"nativeLanguage": "string", 
"targetLanguage": "string", 
"friends": ["uid1", "uid2"], 
"learningProgress": { 
"wordsLearned": 45, 
"streak": 5 
} 
} 
7.2 Conversations Collection 
Path: /conversations/{conversationId} 
{ 
"participants": ["uid1", "uid2"], 
"lastMessage": "string", 
"timestamp": "serverTimestamp", 
"messages": [ 
{ 
"senderId": "uid1", 
"text": "Original message", 
"translated": "Translated text", 
"shadow": "Reinforcement translation", 
"timestamp": "timestamp" 
} 
] 
} 
8. Application Flow (Hermes Journey) 
Step 1: Authentication & Calibration 
• User signs in. 
• First-time users complete onboarding language setup. 
Step 2: Primer Learning Gate 
• Daily flashcard session required before chat access. 
• Completion stored in local app state. 
Step 3: Active Communication 
• User sends message. 
• Translation API processes message. 
• Message stored in Firestore. 
• Receiver obtains real-time update. 
Step 4: Reinforcement & Review 
• Users can save new vocabulary from conversations. 
• Vocabulary added to next learning cycle. 
9. User Journey Example 
1. User logs in and selects French as target language. 
2. Completes daily flashcards. 
3. Starts chat with a friend learning Spanish. 
4. Sends "Bonjour". 
5. App shows: 
o Original: Bonjour 
o Shadow: Hello 
6. Friend receives Spanish translation. 
7. New words automatically suggested for learning. 
10. UI/UX Design Guidelines 
Theme 
• Dark Mode default 
• Primary Accent: Hermes Gold (#FFD700) 
• Background: Deep Sea Black (#121212) 
Typography 
• Sans-serif fonts: 
o Inter 
o Roboto 
Motion & Interaction 
• Smooth message animations 
• Card flipping transitions 
• Swipe gesture support 
11. Development Priorities 
MVP 
• User Authentication 
• Basic Chat Interface 
• Hardcoded translation system 
Phase 2 
• Live Translation API integration 
• Shadow Bubble feature 
Phase 3 
• Flashcard learning system 
• Friend request system 
• Vocabulary extraction automation 
12. Future Enhancements 
• Voice-to-text translation 
• Speech conversation mode 
• AI conversation partners 
• Adaptive learning personalization 
• Community language learning groups 