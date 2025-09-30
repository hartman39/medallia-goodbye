# Thank You, Medallia

A heartfelt goodbye tribute site for my incredible colleagues at Medallia. This interactive web app celebrates the connections, memories, and experiences from my time at one of the world's leading customer experience platforms.

## 🎯 What This Is

A personalized farewell site featuring:

- **💙 Thank You Message** - A heartfelt goodbye to Medallia and its people
- **📸 Photo Gallery** - Shared memories from conferences, team events, and milestones
- **📅 Timeline** - Visualizing my journey through time at Medallia
- **🏢 Where Are They Now** - Data visualization showing top companies Medallia alumni joined
- **💬 Message Board** - Interactive space for colleagues to leave farewell messages
- **🤝 Customer Tribute** - Recognition of amazing clients like Vanguard, Marriott, Walmart, and more

## 🚀 Live Site

Visit the live site at: [https://hartman39.github.io/medallia-goodbye](https://hartman39.github.io/medallia-goodbye)

## 🛠️ Tech Stack

- **React 19** with TypeScript
- **Firebase** - Realtime Database for messages and photo uploads
- **Tailwind CSS** - Responsive, modern UI design
- **D3.js** - Data visualizations
- **Chart.js** - Interactive charts
- **GitHub Pages** - Deployment
- **Google Analytics** - Usage tracking

## 📦 Local Development

### Prerequisites

- Node.js (v16+)
- npm or yarn

### Setup

1. Clone the repository:
```bash
git clone https://github.com/hartman39/medallia-goodbye.git
cd medallia-goodbye
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables (see [SETUP.md](./SETUP.md)):
```bash
cp .env.example .env
# Add your Firebase configuration
```

4. Run the development server:
```bash
npm start
```

Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

### Available Scripts

- **`npm start`** - Runs the app in development mode
- **`npm test`** - Launches the test runner
- **`npm run build`** - Builds the app for production
- **`npm run deploy`** - Deploys to GitHub Pages

## 📁 Project Structure

```
medallia-goodbye/
├── src/
│   ├── components/       # React components (Timeline, Gallery, etc.)
│   ├── utils/           # CSV parser, storage, data processing
│   ├── config/          # Firebase configuration
│   └── App.tsx          # Main application component
├── public/
│   ├── photos/          # Photo gallery images
│   └── index.html       # HTML template with Google Analytics
└── medallia-connection-validator/  # LinkedIn CSV processing tool
```

## 🔧 Additional Tools

### LinkedIn Connection Validator

A standalone utility (`medallia-connection-validator/`) that helps process LinkedIn CSV exports to identify Medallia connections. This tool was used to prepare the data for the "Where Are They Now" visualization.

## 📚 Documentation

- [SETUP.md](./SETUP.md) - Firebase and GitHub deployment setup
- [ANALYTICS_SETUP.md](./ANALYTICS_SETUP.md) - Google Analytics configuration
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment instructions

## 💙 Built With

This project was built with [Claude Code](https://claude.com/product/claude-code) - Anthropic's AI-powered development tool.

## 📝 License

This is a personal project. Feel free to use it as inspiration for your own farewell projects!
