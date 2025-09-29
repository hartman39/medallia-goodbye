# Medallia Memories - Deployment Guide

## Production Deployment Steps

### 1. Generate Production Data
1. Run the app in development mode: `npm start`
2. Upload your LinkedIn connections CSV
3. Review and curate connections in the Review tab
4. Click "🏗️ Generate Production Data" button
5. Download the generated `productionData.ts` file

### 2. Update Production Data
1. Replace the content in `src/utils/productionData.ts` with the downloaded file content
2. The `PRODUCTION_CONNECTIONS` array should now contain your curated connections

### 3. Build for Production
```bash
npm run build
```

### 4. Deploy
Deploy the `build/` folder to any static hosting service:

- **Netlify**: Drag and drop the `build` folder
- **Vercel**: Connect GitHub repo and deploy
- **GitHub Pages**: Copy `build` contents to gh-pages branch
- **AWS S3**: Upload `build` folder contents to S3 bucket

### 5. Verify Production Mode
- In production, the app will automatically use built-in connections
- Upload/Review features will be hidden
- App starts on Timeline view

## Environment Variables

### Development Testing
To test production mode in development, set in `.env.local`:
```
REACT_APP_USE_PRODUCTION_DATA=true
```

## File Structure
```
src/
├── utils/
│   ├── productionData.ts    # Replace with generated file
│   ├── csvParser.ts         # CSV parsing logic
│   └── storage.ts           # Development data storage
├── components/
│   ├── Timeline/           # Timeline visualization
│   ├── NetworkGraph/       # Network visualization
│   └── ReviewConnections/  # Development review interface
└── App.tsx                 # Main app with mode switching
```

## Privacy & Security
- Email addresses are removed from production data
- Profile URLs are stripped for privacy
- Only public information (names, companies, positions) included
- Data is completely static - no server required