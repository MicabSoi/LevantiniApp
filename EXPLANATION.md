# Levantini Mobile App Specification

## App Overview
Levantini is a mobile application for learning Levantine Arabic (spoken in Lebanon, Syria, Jordan, and Palestine). The app focuses on practical, conversational Arabic with an emphasis on real-world usage.

## Core Screens & Features

### 1. Home Screen
- Daily progress widget
- Level and XP display
- Quick action buttons for:
  - Continue lesson
  - Daily words
  - Practice
  - Translation
- Recent activity feed
- Streak calendar

### 2. Learn Tab
```
├── Lessons
│   ├── Progressive chapters
│   ├── Interactive exercises
│   └── Achievement tracking
├── Alphabet
│   ├── Letter recognition
│   ├── Writing practice
│   └── Audio pronunciation
├── Grammar
│   ├── Rule explanations
│   ├── Practice exercises
│   └── Example sentences
└── Pronunciation
    ├── Audio playback
    ├── Recording comparison
    └── Feedback system
```

### 3. Vocabulary Tab
```
├── Word Bank
│   ├── Personal dictionary
│   ├── Categorized lists
│   └── Search functionality
├── Flashcards
│   ├── Spaced repetition
│   ├── Progress tracking
│   └── Custom decks
├── Daily Words
│   ├── New word sets
│   ├── Context examples
│   └── Practice exercises
└── Travel Dictionary
    ├── Common phrases
    ├── Situation-based lists
    └── Offline access
```

### 4. Fluency Tab
```
├── Translation
│   ├── Text input
│   ├── Context awareness
│   └── Example sentences
├── Comprehension
│   ├── Reading exercises
│   ├── Listening practice
│   └── Progress tracking
└── Community
    ├── Discussion forums
    ├── Language exchange
    └── User contributions
```

## Data Models

### User Profile
```typescript
interface User {
  id: string;
  email: string;
  displayName: string;
  level: number;
  xp: number;
  streak: number;
  lastActive: Date;
  preferences: {
    dailyGoal: number;
    notifications: boolean;
    theme: 'light' | 'dark';
  };
}
```

### Learning Progress
```typescript
interface Progress {
  userId: string;
  lessonId: string;
  completed: boolean;
  score: number;
  timestamp: Date;
  mistakes: string[];
}
```

### Vocabulary Item
```typescript
interface VocabularyItem {
  id: string;
  arabic: string;
  transliteration: string;
  translation: string;
  context: string;
  examples: {
    arabic: string;
    transliteration: string;
    translation: string;
  }[];
  audioUrl: string;
  category: string[];
}
```

## UI Components

### Common Elements
- Bottom Navigation Bar
- Progress Indicators
- Audio Players
- Achievement Badges
- Loading States
- Error Messages
- Toast Notifications

### Interactive Elements
- Swipeable Cards
- Drag & Drop Exercises
- Recording Button
- Multi-choice Questions
- Text Input with Arabic Support
- Progress Circles

## API Endpoints

### Authentication
- POST /auth/register
- POST /auth/login
- POST /auth/refresh
- POST /auth/logout

### User Data
- GET /user/profile
- PUT /user/profile
- GET /user/progress
- GET /user/statistics

### Learning Content
- GET /lessons
- GET /lessons/{id}
- GET /vocabulary/daily
- GET /vocabulary/categories
- POST /vocabulary/custom

### Progress Tracking
- POST /progress/lesson
- POST /progress/word
- GET /progress/summary
- GET /progress/achievements

## Local Storage
- User preferences
- Cached lessons
- Offline vocabulary
- Progress data
- Audio files

## Native Features
- Audio recording/playback
- Push notifications
- Offline mode
- Share functionality
- Deep linking

## Performance Requirements
- App size < 50MB
- Launch time < 2s
- Smooth animations (60fps)
- Offline functionality
- Battery efficient

## Security
- Secure authentication
- Data encryption
- API key protection
- Input validation
- Error handling

## Accessibility
- Voice control support
- Dynamic text sizing
- Screen reader support
- High contrast mode
- RTL layout support

## Development Guidelines

### State Management
- User session
- Learning progress
- Audio playback
- Form inputs
- Navigation state

### Error Handling
- Network issues
- Authentication errors
- Data validation
- Audio playback
- Storage limits

### Testing Strategy
- Unit tests
- Integration tests
- UI testing
- Performance testing
- Offline testing

## Build & Release
- Version control
- CI/CD pipeline
- Beta testing
- App store guidelines
- Update strategy

This specification provides the essential information needed to develop the mobile version of Levantini, focusing on core functionality, user experience, and technical requirements.