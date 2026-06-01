# BuéaJobs – Full Stack Setup Guide

## Project Structure
```
bueajobs/
├── server.js          ← Backend (Node.js + Express)
├── package.json       ← Dependencies
├── data/
│   ├── jobs.json      ← Jobs database
│   └── applications.json ← Applications database
└── public/            ← Frontend (served by Express)
    ├── index.html     ← Homepage
    ├── listings.html  ← Browse jobs
    ├── job.html       ← Job detail + Apply
    ├── post-job.html  ← Employers post jobs
    ├── css/style.css
    └── js/script.js
```

---

## Step 1 – Install Node.js
Download from: https://nodejs.org/en/download (choose LTS)
After installing, open Command Prompt and verify:
```
node --version
npm --version
```

---

## Step 2 – Install Dependencies
Open Command Prompt in the project folder and run:
```
npm install
```

---

## Step 3 – Set Up Email Notifications
For the admin email notifications to work, you need a Gmail App Password:

1. Go to your Google Account → Security
2. Enable 2-Step Verification (if not already on)
3. Go to App Passwords → Generate a new one (name it "BuéaJobs")
4. Copy the 16-character password

Then open `server.js` and replace `YOUR_APP_PASSWORD_HERE` with your app password:
```js
pass: 'your-16-char-app-password'
```

---

## Step 4 – Run the Server
```
node server.js
```
You should see:
```
✅ BuéaJobs server running at http://localhost:3000
```

Open your browser and go to: http://localhost:3000

---

## Step 5 – Deploy Online (Free)

### Option A: Railway (Recommended)
1. Create account at https://railway.app
2. Connect your GitHub repository
3. Add environment variable: EMAIL_PASS = your app password
4. Deploy — Railway gives you a free URL

### Option B: Render
1. Create account at https://render.com
2. New Web Service → connect GitHub repo
3. Build Command: `npm install`
4. Start Command: `node server.js`
5. Add environment variable: EMAIL_PASS

---

## Features
- ✅ Browse all jobs with search + filter
- ✅ View detailed job pages
- ✅ Apply for jobs (with CV upload)
- ✅ Employers post jobs
- ✅ Admin email notifications for new jobs and applications
- ✅ Mobile responsive

---

## Admin
All applications are saved in: `data/applications.json`
You receive email notifications at: nemboramostsobzong@gmail.com
