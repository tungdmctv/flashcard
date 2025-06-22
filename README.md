# My Flash Card App

Demo: [Live Demo](https://tungdmctv.github.io/flashcard/)

A simple yet powerful custom your flashcard application for vocabulary learning, built with Nuxt 3. Try it out at [https://tungdmctv.github.io/flashcard/](https://tungdmctv.github.io/flashcard/).

![Flashcard App Screenshot](https://raw.githubusercontent.com/tungdmctv/flashcard/main/public/flashcard/Screenshot-1.png)

Key Features:
- 🔠 Add, Edit, Delete, and Tag Your Custom Words
- 💾 Local storage - no server required - Everything on your device
- 📱 Progressive Web App (PWA) - Install as Application on your device, works offline
- 🎨 Modern UI with Tailwind CSS and Daisy UI - Friendly UI
- 🤖 AI-powered definitions using OpenAI
- 📊 Smart learning tracking system
- 🏷️ Tag-based organization
- 📚 Word filter by tags
- 📊 Statistics dashboard

![Flashcard App Screenshot](https://raw.githubusercontent.com/tungdmctv/flashcard/main/public/flashcard/Screenshot-3.png)

![Flashcard App Screenshot](https://raw.githubusercontent.com/tungdmctv/flashcard/main/public/flashcard/Screenshot-6.png)

![Flashcard App Screenshot](https://raw.githubusercontent.com/tungdmctv/flashcard/main/public/flashcard/Screenshot-5.png)

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

## OR PWA Installation
### 1. Visit the Live Demo
You can access the live demo of the Flashcard application at [https://tungdmctv.github.io/flashcard/](https://tungdmctv.github.io/flashcard/).

### 2. Install as PWA
To install the application as a PWA on your device, follow these steps:
1. Visit the live demo link: [https://tungdmctv.github.io/flashcard/](https://tungdmctv.github.io/flashcard/)
2. For iOS: Tap the "Install App" or "Add to Home Screen" button
3. For Android: Tap the menu button and select "Install App" or "Add to Home Screen"
4. For Desktop: Click the install icon in your browser's address bar

![Flashcard App Screenshot](https://raw.githubusercontent.com/tungdmctv/flashcard/main/public/flashcard/Screenshot-4.png)

The app will install as a PWA and work offline on your device.

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
   - Statistics: View total words, memorized, not memorized, and percentage
   - Speak Out: Listen to the word pronunciation

3. **Settings**:
   - Configure OpenAI API Key
   - Set Custom Prompt
   - Import/Export Vocabulary
   - Reset Statistics

4. **Statistics**:
   - View detailed statistics on words, including total, memorized, not memorized, and percentage

**Note**
   - No vocabulary data initially - you'll need to add words manually or import from previously saved data
