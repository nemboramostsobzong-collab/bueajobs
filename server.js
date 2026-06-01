const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ───────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ─── File Upload (CVs) ────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// ─── DB Helpers ───────────────────────────────────────────────
const DB = {
  read: (file) => {
    const raw = fs.readFileSync(path.join(__dirname, 'data', file), 'utf8');
    return JSON.parse(raw);
  },
  write: (file, data) => {
    fs.writeFileSync(path.join(__dirname, 'data', file), JSON.stringify(data, null, 2));
  }
};

// ─── Email Transporter ────────────────────────────────────────
// IMPORTANT: Replace with your Gmail App Password (not your main password)
// Go to Google Account > Security > 2-Step Verification > App Passwords
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'nemboramostsobzong@gmail.com',
    pass: process.env.EMAIL_PASS || 'YOUR_APP_PASSWORD_HERE'
  }
});

const ADMIN_EMAIL = 'nemboramostsobzong@gmail.com';

// ─── API: Get All Jobs ────────────────────────────────────────
app.get('/api/jobs', (req, res) => {
  const { category, type, search } = req.query;
  let { jobs } = DB.read('jobs.json');
  jobs = jobs.filter(j => j.active);

  if (category && category !== 'all') {
    jobs = jobs.filter(j => j.category.toLowerCase() === category.toLowerCase());
  }
  if (type && type !== 'all') {
    jobs = jobs.filter(j => j.type.toLowerCase() === type.toLowerCase());
  }
  if (search) {
    const q = search.toLowerCase();
    jobs = jobs.filter(j =>
      j.title.toLowerCase().includes(q) ||
      j.company.toLowerCase().includes(q) ||
      j.category.toLowerCase().includes(q)
    );
  }
  res.json({ success: true, count: jobs.length, jobs });
});

// ─── API: Get Single Job ──────────────────────────────────────
app.get('/api/jobs/:id', (req, res) => {
  const { jobs } = DB.read('jobs.json');
  const job = jobs.find(j => j.id === req.params.id);
  if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
  res.json({ success: true, job });
});

// ─── API: Post a Job ──────────────────────────────────────────
app.post('/api/jobs', (req, res) => {
  const { title, company, location, type, category, salary, experience, deadline, description, requirements, companyAbout, contactEmail } = req.body;

  if (!title || !company || !contactEmail || !description) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  const db = DB.read('jobs.json');
  const newJob = {
    id: `j${uuidv4().slice(0, 6)}`,
    title, company,
    location: location || 'Buea, SW Region',
    type, category, salary, experience, deadline, description,
    requirements: requirements ? requirements.split('\n').filter(r => r.trim()) : [],
    companyAbout, contactEmail,
    postedAt: new Date().toISOString().split('T')[0],
    active: true
  };

  db.jobs.push(newJob);
  DB.write('jobs.json', db);

  // Notify admin
  transporter.sendMail({
    from: ADMIN_EMAIL,
    to: ADMIN_EMAIL,
    subject: `🆕 New Job Posted: ${title} at ${company}`,
    html: `
      <h2>New Job Posted on BuéaJobs</h2>
      <table style="font-family:sans-serif;border-collapse:collapse;width:100%">
        <tr><td style="padding:8px;border:1px solid #ddd"><b>Job Title</b></td><td style="padding:8px;border:1px solid #ddd">${title}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd"><b>Company</b></td><td style="padding:8px;border:1px solid #ddd">${company}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd"><b>Type</b></td><td style="padding:8px;border:1px solid #ddd">${type}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd"><b>Category</b></td><td style="padding:8px;border:1px solid #ddd">${category}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd"><b>Contact</b></td><td style="padding:8px;border:1px solid #ddd">${contactEmail}</td></tr>
      </table>
      <p style="margin-top:16px">Log in to your admin panel to review and manage this listing.</p>
    `
  }).catch(console.error);

  res.json({ success: true, message: 'Job posted successfully!', job: newJob });
});

// ─── API: Submit Application ──────────────────────────────────
app.post('/api/apply', upload.single('cv'), (req, res) => {
  const { jobId, fullName, email, phone, coverLetter } = req.body;

  if (!jobId || !fullName || !email) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  const { jobs } = DB.read('jobs.json');
  const job = jobs.find(j => j.id === jobId);
  if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

  const db = DB.read('applications.json');
  const application = {
    id: uuidv4(),
    jobId, jobTitle: job.title, company: job.company,
    fullName, email, phone,
    coverLetter: coverLetter || '',
    cvFile: req.file ? req.file.filename : null,
    appliedAt: new Date().toISOString()
  };

  db.applications.push(application);
  DB.write('applications.json', db);

  // Notify admin
  transporter.sendMail({
    from: ADMIN_EMAIL,
    to: ADMIN_EMAIL,
    subject: `📨 New Application: ${fullName} → ${job.title}`,
    html: `
      <h2>New Job Application on BuéaJobs</h2>
      <table style="font-family:sans-serif;border-collapse:collapse;width:100%">
        <tr><td style="padding:8px;border:1px solid #ddd"><b>Applicant</b></td><td style="padding:8px;border:1px solid #ddd">${fullName}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd"><b>Email</b></td><td style="padding:8px;border:1px solid #ddd">${email}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd"><b>Phone</b></td><td style="padding:8px;border:1px solid #ddd">${phone || 'Not provided'}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd"><b>Job Applied For</b></td><td style="padding:8px;border:1px solid #ddd">${job.title}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd"><b>Company</b></td><td style="padding:8px;border:1px solid #ddd">${job.company}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd"><b>CV Attached</b></td><td style="padding:8px;border:1px solid #ddd">${req.file ? 'Yes' : 'No'}</td></tr>
      </table>
      ${coverLetter ? `<h3>Cover Letter</h3><p>${coverLetter}</p>` : ''}
    `
  }).catch(console.error);

  res.json({ success: true, message: 'Application submitted successfully!' });
});

// ─── API: Admin - Get All Applications ───────────────────────
app.get('/api/admin/applications', (req, res) => {
  const db = DB.read('applications.json');
  res.json({ success: true, applications: db.applications });
});

// ─── Serve Frontend Pages ─────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ─── Start Server ─────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n✅ BuéaJobs server running at http://localhost:${PORT}\n`);
});
