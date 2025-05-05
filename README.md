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

## 📞 Support

For support, email support@levantini.com or join our [Discord community](https://discord.gg/levantini).

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.