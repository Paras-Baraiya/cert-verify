# 🎓 CertVerify — Certificate Verification System (MERN Stack)

A full-stack MERN application for issuing and verifying internship certificates.
Admins upload Excel data; students search by Certificate ID and download a PDF.

---

## 🗂️ Project Structure

```
cert-verify/
├── backend/
│   ├── models/
│   │   ├── User.js             # User model (admin/user roles, bcrypt)
│   │   └── Certificate.js      # Certificate model with virtuals
│   ├── routes/
│   │   ├── auth.js             # Login, Register, Admin create
│   │   ├── admin.js            # Excel upload, cert CRUD, stats
│   │   └── certificates.js     # Public verify + download tracking
│   ├── middleware/
│   │   └── auth.js             # JWT protect + adminOnly guards
│   ├── server.js               # Express entry point
│   └── .env.example
│
├── frontend/src/
│   ├── context/AuthContext.js  # Auth state + axios instance
│   ├── components/
│   │   ├── Navbar.js
│   │   └── CertificateCard.js  # Certificate display + PDF download
│   ├── pages/
│   │   ├── Home.js
│   │   ├── Login.js / Register.js
│   │   ├── VerifyCertificate.js
│   │   ├── MyCertificates.js
│   │   ├── AdminDashboard.js   # Upload, manage, stats
│   │   └── AdminCreatePage.js
│   ├── App.js                  # Routes + auth guards
│   └── index.css               # Full design system
│
├── package.json                # Root concurrently scripts
└── README.md
```

---

## ⚡ Quick Start

### 1. Install All Dependencies
```bash
npm run install-all
```

### 2. Configure Backend Environment
```bash
cd backend
cp .env.example .env
# Edit .env with your MongoDB URI and secrets
```

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/cert-verify
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRE=7d
ADMIN_SECRET=ADMIN_SECRET_2024
CLIENT_URL=http://localhost:3000
```

### 3. Run Development Servers
```bash
# From project root — starts backend (5000) + frontend (3000)
npm run dev
```

---

## 👤 Create Your First Admin

1. Open **http://localhost:3000/setup-admin**
2. Fill name, email, password
3. Enter Secret Key: `ADMIN_SECRET_2024` (set in your .env)

---

## 📊 Excel Upload Format

| Column | Required | Example |
|--------|----------|---------|
| Certificate ID | ✅ | CERT001 |
| Student Name | ✅ | John Doe |
| Internship Domain | ✅ | Web Development |
| Start Date | ✅ | 2024-01-01 |
| End Date | ✅ | 2024-03-31 |
| Email | ❌ | john@example.com |
| College | ❌ | Example University |
| Grade | ❌ | Excellent / Very Good / Good / Satisfactory |

---

## 🔌 API Endpoints

### Auth
- `POST /api/auth/register` — Register user
- `POST /api/auth/login` — Login
- `GET  /api/auth/me` — Get current user (auth required)
- `POST /api/auth/admin/create` — Create admin (requires secret key)

### Certificates (Public)
- `GET  /api/certificates/verify/:certId` — Verify by ID
- `POST /api/certificates/track-download/:certId` — Track download
- `GET  /api/certificates/my` — My certs by email (auth required)

### Admin (auth + admin role required)
- `POST   /api/admin/upload-excel` — Bulk Excel import
- `GET    /api/admin/certificates` — List all (paginated + search)
- `DELETE /api/admin/certificates/:id` — Delete certificate
- `GET    /api/admin/stats` — Dashboard statistics
- `GET    /api/admin/users` — List all users
- `PATCH  /api/admin/users/:id/toggle` — Activate/Deactivate user
- `GET    /api/admin/template` — Download Excel template

---

## 🛡️ Security
- Passwords hashed with **bcrypt** (salt rounds: 12)
- **JWT** authentication with configurable expiry
- Role-based access control (admin / user)
- Input validation via express-validator
- Excel row-level validation with error reporting
- File type + size restrictions on uploads

---

## 🧰 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router 6, Axios |
| PDF Export | jsPDF + html2canvas |
| Backend | Node.js + Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT + bcryptjs |
| Excel | SheetJS (xlsx) |
| Upload | Multer |
| Validation | express-validator |

