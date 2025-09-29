# Setting Up Google Analytics for Your Medallia Goodbye Site

## Quick Setup Guide

### Step 1: Create a Google Analytics Account

1. Go to https://analytics.google.com/
2. Click "Start measuring"
3. Set up an account:
   - Account name: "Medallia Goodbye"
   - Accept terms

### Step 2: Set up a Property

1. Property name: "Medallia Goodbye Site"
2. Select your timezone and currency
3. Click "Next"

### Step 3: Business Information

1. Industry: Other
2. Business size: Small
3. How you intend to use:
   - Examine user behavior
4. Click "Create"

### Step 4: Set up a Web Stream

1. Platform: Web
2. Website URL: `https://hartman39.github.io`
3. Stream name: "Medallia Goodbye"
4. Click "Create stream"

### Step 5: Get Your Measurement ID

1. You'll see a Measurement ID that looks like: `G-XXXXXXXXXX`
2. Copy this ID

### Step 6: Update Your Site

Replace `G-XXXXXXXXXX` in `/public/index.html` (lines 20 and 25) with your actual Measurement ID.

### Step 7: Deploy

```bash
git add -A
git commit -m "Add Google Analytics tracking"
git push origin main
npm run deploy
```

## What You Can Track

Once set up, you can see in your Google Analytics dashboard:

- **Real-time visitors** - Who's on your site right now
- **Total unique visitors** - How many people have visited
- **Page views** - Which pages are most popular
- **Geographic location** - Where visitors are from
- **Device types** - Mobile vs Desktop
- **Traffic sources** - How people found your site
- **Time on site** - How long people stay
- **Most viewed photos** - If we add event tracking

## Privacy Notes

- Only you can see this data (via your Google Analytics account)
- Visitors won't see any tracking information
- The tracking is anonymous - you won't see individual names
- Respects browser "Do Not Track" settings

## View Your Analytics

After setup, view your analytics at: https://analytics.google.com/

Data starts appearing within a few hours of deployment.