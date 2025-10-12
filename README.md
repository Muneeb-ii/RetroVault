# RetroVault: The AI Time Machine for Your Finances

A comprehensive personal finance management platform that combines nostalgic Windows 98 aesthetics with modern AI-powered financial insights and advanced forecasting capabilities.

## 🎯 Overview

RetroVault is a full-stack financial management application that provides users with comprehensive tools for tracking expenses, analyzing spending patterns, and planning for the future. The platform features an AI-powered financial assistant, advanced time machine projections, and personalized financial storytelling.

## ✨ Key Features

### **Financial Dashboard**
- Real-time balance tracking and financial summaries
- Interactive charts and visualizations for spending analysis
- Weekly balance trends and savings tracking
- Recent transactions with smart categorization

### **AI Financial Assistant (Eliza)**
- Personalized financial advice based on your spending patterns
- Multiple AI model support (Google Gemini, Claude, GPT-4)
- Contextual insights and recommendations
- Voice-enabled interactions with ElevenLabs integration

### **Time Machine Projections**
- Advanced Monte Carlo simulations for financial forecasting
- Retirement readiness calculations
- Scenario-based planning (Conservative, Moderate, Aggressive)
- Interactive milestone tracking and goal setting

### **Story Mode**
- AI-generated financial narratives based on your data
- Personalized storytelling with voice narration
- Financial journey visualization
- Export capabilities for sharing insights

### **Comprehensive Data Management**
- Transaction categorization and analysis
- Budget tracking and goal setting
- Multi-account support
- Data synchronization and backup

## 🛠️ Technology Stack

### **Frontend**
- **React 18** with modern hooks and context API
- **Vite** for fast development and building
- **TailwindCSS** for responsive styling
- **98.css** for authentic retro aesthetics
- **Recharts** for interactive data visualizations

### **Backend & Database**
- **Firebase Firestore** for real-time data storage
- **Firebase Authentication** with Google Sign-In
- **Vercel Serverless Functions** for API endpoints
- **Node.js** for backend processing

### **AI & External APIs**
- **Google Gemini 2.0** for financial insights
- **OpenRouter** for multi-model AI support
- **ElevenLabs** for voice synthesis
- **Capital One Nessie API** for real financial data integration

### **Deployment & Infrastructure**
- **Vercel** for hosting and serverless functions
- **Firebase** for authentication and database
- **Environment-based configuration** for secure API management

## 🚀 Getting Started

### **Prerequisites**
- Node.js 18+ and npm
- Firebase project setup
- API keys for external services (optional)

### **Installation**

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/retrovault.git
   cd retrovault
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Add your API keys to `.env.local`:
   ```env
   # Firebase Configuration
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   
   # AI Services
   VITE_OPENROUTER_API_KEY=your_openrouter_key
   VITE_GOOGLE_GEMINI_API_KEY=your_gemini_key
   VITE_ELEVENLABS_API_KEY=your_elevenlabs_key
   
   # Financial Data
   VITE_NESSIE_API_KEY=your_nessie_key
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   Navigate to `http://localhost:5173`

## 🔧 Configuration

### **Firebase Setup**
1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Authentication with Google Sign-In
3. Enable Firestore Database with appropriate security rules
4. Generate service account credentials for backend functions

### **AI Services Configuration**
- **OpenRouter**: Get API key from [openrouter.ai](https://openrouter.ai) for multi-model AI support
- **Google Gemini**: Configure Gemini API for enhanced financial insights
- **ElevenLabs**: Set up voice synthesis for audio features

### **Financial Data Integration**
- **Capital One Nessie**: Optional integration for real financial data
- **Mock Data**: Built-in sample data for testing and development

## 📁 Project Structure

```
RetroVault/
├── src/
│   ├── components/           # Reusable UI components
│   │   ├── tools/          # Specialized tool components
│   │   ├── TopNav.jsx      # Navigation component
│   │   ├── SideBar.jsx     # Main sidebar
│   │   └── MainPanel.jsx   # Dashboard display
│   ├── pages/              # Main application pages
│   │   ├── RetroDashboard.jsx
│   │   ├── TimeMachine.jsx
│   │   ├── StoryMode.jsx
│   │   └── Insights.jsx
│   ├── contexts/           # React context providers
│   │   └── UnifiedDataContext.jsx
│   ├── api/                # API service layers
│   │   ├── aiService.js
│   │   ├── timeMachineService.js
│   │   ├── storyService.js
│   │   └── unifiedFirestoreService.js
│   ├── services/           # Business logic services
│   ├── utils/              # Utility functions
│   └── assets/             # Static assets
├── api/                    # Vercel serverless functions
├── public/                 # Public assets
└── scripts/               # Deployment and utility scripts
```

## 🎨 Design System

### **Retro Aesthetic**
- Windows 98-inspired interface design
- CRT monitor visual effects and scanlines
- Classic computer color palette
- Pixel-perfect typography and spacing

### **Modern UX**
- Responsive design for all device sizes
- Smooth animations and transitions
- Intuitive navigation and user flows
- Accessibility considerations

### **Color Palette**
- **Primary Blue**: #4A90E2
- **Retro Gray**: #C0C0C0
- **Success Green**: #00FF00
- **Background**: Gradient from blue-900 to blue-700

## 🔒 Security & Privacy

- **Firebase Security Rules** for data protection
- **Environment-based API key management**
- **User authentication** with Google OAuth
- **Data encryption** in transit and at rest
- **GDPR compliance** considerations

## 📊 Performance Features

- **Real-time data synchronization**
- **Optimized database queries**
- **Efficient state management**
- **Lazy loading** for improved performance
- **Caching strategies** for API responses

## 🚀 Deployment

### **Production Deployment**
```bash
npm run build
vercel --prod
```

### **Environment Variables (Production)**
Configure the following in your Vercel dashboard:
- Firebase service account credentials
- API keys for external services
- Database connection strings

## 🤖 AI Capabilities

### **Financial Analysis**
- Spending pattern recognition
- Budget optimization suggestions
- Investment opportunity identification
- Risk assessment and recommendations

### **Predictive Modeling**
- Monte Carlo simulations
- Retirement planning projections
- Scenario-based forecasting
- Goal achievement probability

### **Natural Language Processing**
- Conversational financial advice
- Voice-enabled interactions
- Personalized storytelling
- Multi-language support

## 📈 Analytics & Reporting

- **Spending breakdowns** by category
- **Income vs. expense** analysis
- **Savings rate** calculations
- **Financial health** scoring
- **Trend analysis** and forecasting

## 🔮 Future Roadmap

- [ ] Advanced investment tracking
- [ ] Cryptocurrency integration
- [ ] Tax optimization features
- [ ] Multi-currency support
- [ ] Advanced AI model fine-tuning
- [ ] Mobile application development
- [ ] API for third-party integrations

## 🤝 Contributing

We welcome contributions to RetroVault! Please see our contributing guidelines for:
- Code style and standards
- Testing requirements
- Pull request process
- Issue reporting

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the documentation
- Review the troubleshooting guide

---

**RetroVault** - Where nostalgic design meets modern financial technology.