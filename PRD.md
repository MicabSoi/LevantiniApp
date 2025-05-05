Levantini - Mobile Language Learning Platform

Product Overview

Levantini is a comprehensive mobile-first web app designed to help users learn conversational Levantine Arabic (spoken in Lebanon, Syria, Jordan, and Palestine) through an engaging, culturally-rich and interactive experience. It combines the structure of Duolingo-style quizzes, the effectiveness of Anki-style spaced repetition flashcards, and the authenticity of grammar insights passed down from native speakers.

Vision Statement

To become the leading platform for learning spoken Levantine Arabic, offering a community-driven, AI-supported, and culturally immersive language learning experience that bridges the gap between classroom theory and real-world communication.

Target Audience

Primary Users

Language Enthusiasts (25–45 years)

Second-generation Arabs seeking cultural reconnection

Travellers and expats in the Levant region

Linguists and language nerds interested in niche dialects

Self-learners who’ve struggled with Modern Standard Arabic (MSA)

User Personas

Amina (29) – Second-gen Lebanese in Sydney

Wants to connect with her grandparents

Prefers cultural notes and native-level examples

Uses mobile apps daily and values offline functionality

Liam (34) – Language Nerd from the UK

Learned MSA but couldn’t apply it in real conversations

Familiar with Anki decks and spaced repetition

Would pay for accurate grammar breakdowns and authentic phrasing

Salma (21) – Uni Student in Jordan

Interested in teaching Levantine Arabic informally

Likes small, mobile-first lessons and community engagement

Would contribute community decks and content if platform supports it

Business Model

Freemium Strategy

Free Tier:

Access to beginner lessons and basic quizzes

Limited flashcards per day

Ads displayed periodically (e.g. every 3 lessons or 10 minutes)

Premium Subscription:

Removes all ads

Unlocks advanced lessons, AI-generated stories, grammar deep dives, and pronunciation tools

Additional community/forum access

Revenue Streams

In-app advertising

Monthly/yearly subscriptions

Future partnerships with cultural organisations and travel platforms

Functional Requirements

Core Features

1. Learning Management

Daily goals and streaks

Progress tracking

Spaced repetition system

Achievement system

Community forum and tutor access (future)

2. Content Modules

Vocabulary builder

Grammar lessons with cultural notes

Pronunciation guide

Interactive theory and exercises

AI-generated short stories across fluency levels

3. Practice Tools

Flashcard system (with spaced repetition)

Audio pronunciation (future)

Writing practice

Speaking input (optional, API-dependent)

AI-powered translation tool for context-based meaning

4. User Experience

Offline-first architecture

Light/dark mode

Progress sync across devices

Custom study schedules

Performance analytics and review prompts

Technical Specifications

Frontend

React with TypeScript

Vite for build tooling

TailwindCSS for styling

Lucide React for icons

PWA support (installable on mobile devices)

Backend

Supabase:

User authentication

Data storage (lessons, progress, flashcards)

Real-time database sync

File hosting for audio/images

Architecture Overview

REST API interactions via Supabase

GPT-4 API for translation, grammar explanations, and story generation

Future support for text-to-speech (TTS) audio if cost-effective

AI Integration Points

Feature

AI Usage

Vocabulary Translation

GPT/OpenAI with dialect-specific prompts

Story Generation

Level-based narrative content (toddler to adult)

Grammar Explanation

Custom prompt-engineered explanations

Pronunciation Evaluation

(Planned) via third-party APIs

Flashcard Curation

Example sentences and definition generation

Non-Functional Requirements

Accessibility: Contrast-compliant UI, text resizing, ARIA labels

Maintainability: Modular components, documented endpoints and prompts

Security: Supabase auth, rate-limited API keys, encrypted storage

Offline Capability: Caching of key data and lessons

Resilience: Retry strategies for API failures, graceful error messages

User Flows

Core Learning Flow

User logs in

Chooses a daily lesson

Completes interactive quizzes

Reviews suggested flashcards

Unlocks achievements / streaks

Practice Flow

User selects topic

Practices with flashcards or grammar

Reviews performance

Receives suggestions for review

Competitive Advantage

Focuses solely on Levantine Arabic (not MSA)

Combines the three proven methods: gamified quizzes, flashcard memory, and cultural grammar

Content created and refined by AI, with native-level dialect tuning

Includes cultural context to aid real-world conversations

Offline-first with minimal data usage

Success Metrics

Engagement

Daily active users

Session duration

Lesson completion rate

Streak retention

Learning Effectiveness

Words retained (via SRS)

Quiz accuracy rate

Grammar mastery badges

Re-test performance

Technical Performance

App load time < 2s

Offline availability

Sync success rate

Crash/error rates

Monetisation

Ad impressions vs bounce rate

Conversion to premium

Churn rate

Development Timeline

Phase 1: Foundation (Months 1–2)

Core app structure (web)

Authentication

Supabase database setup

Topic/lesson UI and basic quizzes

Phase 2: Core Features (Months 3–4)

Flashcards and spaced repetition

Grammar theory modules

Progress tracking

Phase 3: AI & Content (Months 5–6)

GPT integration for stories and grammar

AI quiz generator

Offline caching system

Phase 4: Polish & Deploy (Month 7)

UX/UI refinement

App Store wrap (via Capacitor)

Bug fixes and performance tuning

Beta user testing and soft launch

Go-To-Market Plan

Soft launch for feedback with handpicked users

Social media content (Instagram/TikTok) based on lessons

Outreach to Levantine communities in diaspora

Publish to iOS and Android app stores

Collect feedback, monitor retention, optimise onboarding

Integration Requirements

Third-Party Services

OpenAI (GPT) for translations, grammar and story generation

Optional: TTS (text-to-speech) service for pronunciation

Sentry or equivalent for error tracking

Plausible or PostHog for analytics

Data Integration

Supabase-managed lesson, user, and flashcard data

Cross-device sync

Local storage backup and restoration

Security and Privacy

End-to-end encryption for stored data

GDPR-compliant policies for consent and retention

Privacy-first design with opt-in analytics

Secure auth via Supabase + OAuth

Performance Requirements

Load time: < 2 seconds

Time to interactive: < 3 seconds

Storage: < 100MB per user

RAM usage: < 200MB

Battery impact: Minimal (<5%)

Uptime: 99.9%

Scalability: Supports 100k+ users, 1M+ daily requests

API response time: < 100ms

Appendix

This PRD reflects the current solo-dev roadmap for Levantini. Features may shift slightly based on AI API costs, user feedback, and growth of the user base.
