# RetroVault: The AI Time Machine for Your Finances

A nostalgic reimagining of early-2000s personal finance software with modern AI capabilities.

## 🎯 Project Overview

RetroVault combines the nostalgic charm of Windows 98-era financial software with cutting-edge AI insights. Built for hackathons, this app provides a "financial time machine" experience using Capital One's Nessie API and Google Gemini AI.

## 🚀 Features

- **Retro Dashboard**: Windows 98-style interface with modern functionality
- **AI Insights**: Powered by Google Gemini for personalized financial advice
- **Time Machine**: Navigate through past, present, and future financial scenarios
- **Interactive Charts**: Beautiful visualizations using Recharts
- **Responsive Design**: Works on desktop and mobile devices

## 🛠️ Tech Stack

- **Frontend**: React + Vite + TailwindCSS + 98.css
- **Backend**: Node.js + Express (Vercel Serverless)
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth (Google Sign-In)
- **APIs**: Capital One Nessie API + OpenRouter AI
- **Charts**: Recharts for data visualization
- **State Management**: Zustand
- **Deployment**: Vercel

## 🎨 Design Philosophy

- **Nostalgic UI**: Windows 98-inspired interface with CRT monitor aesthetics
- **Modern UX**: Responsive design with smooth interactions
- **Retro Colors**: Pastel blues, grays, and classic computer colors
- **Pixel Perfect**: Attention to detail in typography and spacing

## 🚀 Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment Variables**
   - Copy `.env.example` to `.env.local` and add your API keys:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your API keys
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Open in Browser**
   Navigate to `http://localhost:5173`

## 🔥 Full-Stack Deployment

### **Firebase Setup**
1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Authentication (Google Sign-In)
3. Enable Firestore Database
4. Generate service account key for backend
5. Get Firebase config for web app

### **Environment Variables**
```bash
# Frontend (.env.local)
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_OPENROUTER_API_KEY=your_openrouter_key
VITE_NESSIE_API_KEY=your_nessie_key

# Backend (Vercel Environment Variables)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_service_account_email
FIREBASE_PRIVATE_KEY=your_private_key
NESSIE_API_KEY=your_nessie_key
OPENROUTER_API_KEY=your_openrouter_key
```

### **Deploy to Vercel**
```bash
npm run build
vercel --prod
```

### **Populate Sample Data**
```bash
node scripts/deploy.js
```

## 📁 Project Structure

```
RetroVault/
├── src/
│   ├── components/         # React components
│   ├── pages/             # Page components
│   ├── api/               # API services
│   │   ├── aiService.js   # OpenRouter AI integration
│   │   ├── nessieService.js # Capital One Nessie API
│   │   ├── timeMachineService.js # Time Machine AI
│   │   ├── storyService.js # Story Mode AI
│   │   └── syncNessieToFirestore.js # Backend sync
│   ├── store/             # Zustand state management
│   ├── data/              # Mock data generators
│   ├── scripts/           # Deployment scripts
│   ├── firebaseAdmin.js   # Firebase Admin SDK
│   ├── firebaseClient.js  # Firebase Client SDK
│   └── index.css          # Global styles
├── api/                   # Vercel serverless functions
│   └── syncNessieToFirestore.js
├── scripts/               # Deployment scripts
├── firestore.rules        # Firestore security rules
├── vercel.json            # Vercel configuration
└── .env.example           # Environment variables template
```

## 🎯 Hackathon Ready

This project is designed to be hackathon-ready with:
- ✅ Complete UI layout
- ✅ Mock data integration
- ✅ Responsive design
- ✅ Retro aesthetics
- ✅ Modular component structure
- ✅ Ready for API integration

## 🤖 AI Integration

RetroVault includes dynamic AI insights powered by OpenRouter:

### **Supported AI Models:**
- **Google Gemini 1.5 Pro** (default)
- **Claude 3.5 Sonnet**
- **GPT-4o**
- **Llama 3.1 8B**

### **AI Features:**
- **Dynamic Insights**: AI analyzes your financial data and provides personalized advice
- **Model Selection**: Choose between different AI models in the top navigation
- **Fallback System**: Graceful degradation to static insights if AI is unavailable
- **Real-time Analysis**: Insights update when you refresh your financial data

### **Setup API Integration:**

#### **AI Integration (OpenRouter):**
1. Get an API key from [OpenRouter](https://openrouter.ai/)
2. Add it to your `.env.local` file:
   ```
   VITE_OPENROUTER_API_KEY=your_api_key_here
   ```

#### **Real Financial Data (Capital One Nessie):**
1. Get an API key from [Capital One Developer](https://developer.capitalone.com/)
2. Add it to your `.env.local` file:
   ```
   VITE_NESSIE_API_KEY=your_api_key_here
   ```
3. Restart the development server

**Note:** The app works with mock data if no API keys are configured!

## 💾 Real Financial Data Integration

RetroVault integrates with Capital One's Nessie API for real financial data:

### **Nessie API Features:**
- **Real Account Data**: Fetches actual account balances and information
- **Transaction History**: Shows real transactions from the last 30 days
- **Smart Categorization**: Automatically categorizes transactions (Food, Transport, Entertainment, etc.)
- **Data Source Indicator**: Shows whether you're viewing real or mock data
- **Graceful Fallback**: Automatically falls back to mock data if API is unavailable

### **Data Processing:**
- **Transaction Analysis**: Real spending patterns and trends
- **Savings Calculation**: Derived from actual income vs expenses
- **Chart Generation**: All charts use real transaction data
- **AI Insights**: AI analyzes your actual financial behavior

## 🔮 Future Enhancements

- [ ] Real-time data synchronization
- [ ] Advanced financial forecasting
- [ ] Interactive time travel features
- [ ] Sound effects and animations
- [ ] Custom AI prompt templates

## 🎨 Color Palette

- **Retro Blue**: #4A90E2
- **Retro Gray**: #C0C0C0
- **CRT Green**: #00FF00
- **Background**: Gradient from blue-900 to blue-700

## 📱 Responsive Design

The app is fully responsive and works on:
- Desktop (primary target)
- Tablet
- Mobile (with adapted layout)

## 🤝 Contributing

This is a hackathon project! Feel free to:
- Add new features
- Improve the retro aesthetics
- Integrate additional APIs
- Enhance the AI capabilities

---

**Built with ❤️ for hackathons and retro computing enthusiasts**
