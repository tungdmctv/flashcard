# Flashcard App

Demo: [Live Demo](https://github.com/tungdmctv/flashcard)

A simple yet powerful flashcard application for vocabulary learning, built with Nuxt 3. Try it out at [https://github.com/tungdmctv/flashcard](https://github.com/tungdmctv/flashcard).

![Flashcard App Screenshot](https://raw.githubusercontent.com/tungdmctv/flashcard/main/docs/screenshot.png)

Key Features:
- 📱 Progressive Web App (PWA) - works offline
- 💾 Local storage - no server required
- 🎨 Modern UI with Tailwind CSS and Daisy UI
- 🤖 AI-powered definitions using OpenAI
- 📊 Smart learning tracking system
- 🏷️ Tag-based organization

## 1. Application Overview
The Flashcard application is built with Nuxt3 for vocabulary memorization with these key features:
- Data stored in Local DB
- PWA/SSG that works without a server
- Designed with Tailwind and Daisy UI

Main Features:
1. Add/edit/delete vocabulary with custom tags
2. AI (OpenAI) integration for automatic definitions
3. Quiz modes (sequential and random)
4. Tracking system for memorized/unmemorized words
5. Smart display based on user statistics
6. Filter words by tags


## 2. Installation
```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Generate static project
npm run generate
```

## 3. Usage Guide
1. **Vocabulary Management**:
   - Add new words using "Add Vocabulary" button
   - Edit or delete existing words
   - Add tags to words

2. **Quiz Mode**:
   - Select display mode (sequential or random)
   - Click cards to reveal translations
   - Mark words as "Memorized" or "Not Memorized"
   - Filter words by tags (shows all if none selected)

3. **Settings**:
   - Configure OpenAI API Key
   - Set Custom Prompt

The application can be directly deployed on GitHub Pages.
