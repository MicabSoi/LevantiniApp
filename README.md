# Levantini

A modern, interactive platform for learning Levantine Arabic, built with React, TypeScript, and Supabase.

## 🌟 Features

- Interactive lessons and exercises
- Personalized learning paths
- Vocabulary builder with spaced repetition
- Grammar lessons with practical examples
- Pronunciation guide with audio
- Progress tracking and analytics
- Offline support
- Dark mode support

## 🚀 Tech Stack

- **Frontend**: React, TypeScript, Vite
- **Styling**: TailwindCSS
- **Icons**: Lucide React
- **Backend**: Supabase
- **State Management**: React Context
- **Authentication**: Supabase Auth
- **Database**: Supabase PostgreSQL
- **API Integration**: OpenAI

## 📦 Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/levantini.git
   cd levantini
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Fill in your Supabase and OpenAI API credentials.

4. Start the development server:
   ```bash
   npm run dev
   ```

## 🏗️ Project Structure

```
src/
├── components/        # React components
├── context/          # Context providers
├── hooks/            # Custom hooks
├── styles/           # Global styles
├── types/            # TypeScript types
├── utils/            # Utility functions
└── App.tsx           # Main app component
```

## 🔧 Configuration

### Environment Variables

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
VITE_OPENAI_API_KEY=your_openai_key
```

### Supabase Setup

1. Create a new Supabase project
2. Set up authentication providers
3. Run database migrations
4. Configure storage buckets
5. Set up row-level security policies

## 🧪 Testing

Run the test suite:

```bash
npm run test
```

### Test Coverage

```bash
npm run test:coverage
```

## 🚀 Deployment

1. Build the production bundle:
   ```bash
   npm run build
   ```

2. Preview the build:
   ```bash
   npm run preview
   ```

3. Deploy to your hosting platform of choice (e.g., Netlify, Vercel)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a pull request

### Development Guidelines

- Follow the existing code style
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed

## 📝 API Documentation

### Authentication

```typescript
// Sign up
const signUp = async (email: string, password: string) => {
  const { user, error } = await supabase.auth.signUp({
    email,
    password
  });
};

// Sign in
const signIn = async (email: string, password: string) => {
  const { user, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
};
```

### Database Operations

```typescript
// Fetch user progress
const getUserProgress = async (userId: string) => {
  const { data, error } = await supabase
    .from('progress')
    .select('*')
    .eq('user_id', userId);
};

// Update learning status
const updateLearningStatus = async (wordId: string, status: string) => {
  const { data, error } = await supabase
    .from('learned_words')
    .upsert({ word_id: wordId, status });
};
```

## 🔒 Security

- All API requests are authenticated
- Data is encrypted in transit
- Sensitive data is never stored in local storage
- Regular security audits are performed

## 🔍 Monitoring

- Error tracking with console logging
- Performance monitoring
- User analytics
- API usage tracking

## 🤖 ChatGPT Context

This section provides a detailed overview of the Levantini project, intended to serve as contextual background for a ChatGPT project.

The Levantini project is a web application built with React and TypeScript, using Supabase as the backend and integrating with OpenAI. Its primary goal is to provide an interactive platform for learning Levantine Arabic.

**Project Overview:**

*   **Purpose:** To facilitate learning Levantine Arabic through interactive lessons, vocabulary building, grammar, pronunciation, and progress tracking.
*   **Target Audience:** Individuals learning Levantine Arabic.
*   **Key Features:** Interactive lessons, personalised paths, vocabulary builder (spaced repetition), grammar, pronunciation, progress tracking, offline support, dark mode.

**Technical Stack:**

*   **Frontend:** React, TypeScript, Vite, TailwindCSS, Lucide React
*   **Backend:** Supabase (PostgreSQL database, Authentication, Edge Functions)
*   **API Integration:** OpenAI

**Architecture and Structure:**

*   The application follows a component-based architecture using React.
*   State management is handled via React Context (`src/context/`).
*   Custom hooks (`src/hooks/`) are used for logic abstraction, such as interacting with Supabase (`useDecks.ts`, `useFlashcards.ts`).
*   Utility functions and service logic are located in `src/lib/`.
*   TypeScript types are defined in `src/types/` to ensure type safety, including Supabase types (`supabase.ts`).

**Supabase Integration:**

*   Supabase is used for authentication (`supabase.auth`).
*   The PostgreSQL database stores application data. Key tables likely include:
    *   `progress`: Tracks user learning progress.
    *   `learned_words`: Manages vocabulary learning status.
    *   Other tables related to lessons, flashcards, decks, etc.
*   Database schema changes are managed via migrations (`supabase/migrations/`).
*   Supabase Edge Functions (`supabase/functions/`) are used for server-side logic, such as `cloneDefaultDecks`.
*   The Supabase client is initialised and configured in `src/lib/supabaseClient.ts`.
*   Supabase context is managed in `src/context/SupabaseContext.tsx`.

**OpenAI Integration:**

*   OpenAI is integrated into the project (mentioned in `README.md` and environment variables).
*   It is likely used for language-related tasks, such as translation, grammar checking, or generating examples, although the specific implementation details are not fully described in the provided context.

**Relevant Files for Context:**

*   `README.md`: High-level project description, features, tech stack, installation, structure, configuration, API examples.
*   `package.json`: Project dependencies (React, Supabase, TailwindCSS, etc.).
*   `.env`: Environment variables for Supabase URL/Key and OpenAI API Key.
*   `src/types/supabase.ts`: TypeScript types generated from the Supabase database schema.
*   `src/lib/supabaseClient.ts`: Supabase client initialisation.
*   `src/context/SupabaseContext.tsx`: Supabase context provider.
*   `src/components/`: Contains various UI components for different features (lessons, vocabulary, auth, etc.).
*   `supabase/migrations/`: Database schema migration files.
*   `supabase/functions/`: Supabase Edge Functions code.

## 📞 Support

For support, email support@levantini.com or join our [Discord community](https://discord.gg/levantini).

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
