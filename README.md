<div align="center">

# ✨ AETHERIA — Digital Sentience

**Transform your emotions into living, breathing 3D art**

*An AI-powered emotion visualization experience that turns your feelings into mesmerizing digital matter*

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://ai.studio/apps/drive/1jzMp_Qw3-TgPEbkzkNuapv8mBtXJD6_3)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-18.3-61dafb.svg)](https://reactjs.org/)
[![Three.js](https://img.shields.io/badge/Three.js-0.171-000000.svg)](https://threejs.org/)

</div>

---

## 🌟 What is Aetheria?

Aetheria is an immersive emotional wellness platform that combines **artificial intelligence**, **3D visualization**, and **mental health practices** to create a unique digital experience. Share your thoughts and feelings, and watch as AI interprets your emotions and transforms them into stunning, interactive 3D visualizations.

Think of it as a **digital mood lamp meets emotion diary** — but exponentially more beautiful and therapeutic.

### ✨ Key Features

**🎨 AI-Powered Emotion Visualization**
- Advanced sentiment analysis using Groq/Gemini AI
- 5 unique visualization modes: Aurora, Particle Field, Geometric, Nebula & Fluid
- Real-time 3D rendering with dynamic colors, speed, and distortion based on your emotions

**🧘 Wellness & Mindfulness**
- Guided meditation sessions with synchronized visuals
- Daily emotional check-ins with streak tracking
- Emotion timeline to track your mood patterns over time
- Personalized affirmations based on your emotional state

**🎵 Interactive Experiences**
- Music-reactive mode — visualizations dance to your music
- AR mode — bring your emotions into the real world via your phone camera
- Voice input support for hands-free interaction
- Ambient mode for passive, evolving background art

**👥 Social & Sharing**
- Community gallery to share your favorite visualizations
- Collaboration rooms for shared emotional experiences
- Follow system to connect with other users
- Comments and reactions on shared creations

**🎛️ Customization & Control**
- Manual controls to fine-tune color, speed, and distortion
- Custom presets to save your favorite configurations
- Collections to organize your emotional moments
- Video export to download your visualizations
- Multiple theme support (light/dark/custom)

**♿ Accessibility First**
- Reduced motion mode
- High contrast mode
- Screen reader support
- Adjustable font sizes
- Keyboard shortcuts throughout

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v16 or higher)
- **npm** or **yarn**
- A **Groq API key** (get one free at [groq.com](https://groq.com))
- Optional: **Supabase account** for authentication and social features

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Akidima/AETHERIA.git
   cd AETHERIA
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` and add your API keys:
   ```env
   # Required for AI sentiment analysis
   VITE_GROQ_API_KEY=your-groq-api-key
   
   # Optional: For authentication and social features
   VITE_SUPABASE_URL=your-supabase-project-url
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   
   Navigate to `http://localhost:5173` (or the port shown in your terminal)

---

## 🎨 Usage

### Basic Flow

1. **Share Your Feelings** — Type how you're feeling in the input field
2. **AI Analysis** — Aetheria's AI interprets the emotional content
3. **Watch the Magic** — Your emotions come alive as 3D art
4. **Explore & Customize** — Adjust settings, save favorites, or share with others

### Keyboard Shortcuts

- `F` — Toggle fullscreen
- `S` — Take a screenshot
- `M` — Toggle meditation mode
- `A` — Toggle ambient mode
- `Esc` — Close modals

### Available Visualization Modes

- **🌌 Aurora** — Flowing northern lights effect
- **✨ Particle Field** — Floating, dancing particles
- **📐 Geometric** — Abstract geometric patterns
- **🌠 Nebula** — Space-like cloud formations
- **🌊 Fluid** — Smooth, flowing liquid motion

---

## 🏗️ Project Structure

```
aetheria/
├── components/           # React components
│   ├── visualizations/  # 3D visualization components
│   ├── Scene.tsx        # Main 3D scene renderer
│   ├── Navigation.tsx   # Navigation menu
│   └── ...              # Feature components
├── services/            # API and service integrations
│   ├── aiService.ts     # AI sentiment analysis
│   ├── audioService.ts  # Audio processing
│   └── geminiService.ts # Gemini AI integration
├── api/                 # Serverless API routes
├── hooks/               # Custom React hooks
├── contexts/            # React context providers
├── store/               # Zustand state management
└── types.ts             # TypeScript type definitions
```

---

## 🛠️ Tech Stack

- **Frontend:** React 18, TypeScript, Vite
- **3D Graphics:** Three.js, React Three Fiber, Drei
- **Animation:** Framer Motion
- **AI:** Groq API (Llama 3.3), Google Gemini
- **Backend:** Supabase (Auth, Database, Storage)
- **State Management:** Zustand
- **Styling:** Tailwind CSS
- **Deployment:** Vercel

---

## 🌐 Deployment

### Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Akidima/AETHERIA)

1. Click the button above or connect your repository to Vercel
2. Add your environment variables in the Vercel dashboard
3. Deploy!

### Environment Variables for Production

Make sure to set these in your deployment platform:

```env
VITE_GROQ_API_KEY=your-groq-api-key
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
GROQ_API_KEY=your-groq-api-key (for serverless functions)
```

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **AI Models:** Groq (Llama 3.3), Google Gemini
- **3D Library:** Three.js team
- **Inspiration:** The intersection of technology, art, and mental wellness
- **Community:** All the amazing users sharing their emotional journeys

---

## 📧 Contact

**Project Link:** [https://github.com/Akidima/AETHERIA](https://github.com/Akidima/AETHERIA)

**Live Demo:** [https://ai.studio/apps/drive/1jzMp_Qw3-TgPEbkzkNuapv8mBtXJD6_3](https://ai.studio/apps/drive/1jzMp_Qw3-TgPEbkzkNuapv8mBtXJD6_3)

---

<div align="center">

**Made with ❤️ and ✨ digital sentience**

*Transform your emotions into art. One feeling at a time.*

</div>