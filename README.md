# SecureQR - Encrypted and Secure QR Code Platform

## 🎯 Project Overview

*Project Name*: SecureQR - Encrypted and Secure QR Code Platform

*Description*: A comprehensive web platform built with Next.js 15 for creating and managing encrypted and secure QR codes with advanced authentication system and full administrative dashboard.

---

## 🏗 Technical Stack

### Frontend:
- *Framework*: Next.js 15.2.4 (React 19)
- *Styling*: Tailwind CSS 3.4.17 + Tailwind Animate
- *UI Components*: Radix UI Components (shadcn/ui)
- *Icons*: Lucide React
- *Forms*: React Hook Form + Zod Validation
- *Theme*: next-themes for dark/light mode
- *Charts*: Recharts 2.15.0

### Backend:
- *Runtime*: Node.js with Next.js API Routes
- *Database*: MongoDB 6.16.0 + Mongoose 8.15.0
- *Authentication*: JWT (JSON Web Tokens) with jose 6.0.11
- *Encryption*:
  - bcrypt 6.0.0 for password hashing
  - crypto-js for advanced encryption (AES-256)
- *QR Code Generation*: qrcode library
- *QR Code Scanning*: html5-qrcode 2.3.8

### Development Tools:
- *Language*: TypeScript 5
- *Package Manager*: npm / pnpm
- *Environment*: dotenv for environment variables

---

## 📁 Project Structure

```
project-root/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── admin/               # Admin APIs
│   │   │   ├── owner/           # Owner management
│   │   │   ├── settings/        # System settings
│   │   │   └── users/           # User management
│   │   ├── generate/            # QR code generation
│   │   ├── login/               # Login
│   │   ├── logout/              # Logout
│   │   ├── qrcodes/             # QR code management
│   │   ├── register/            # User registration
│   │   ├── usage/               # Usage statistics
│   │   ├── user/                # User data
│   │   └── verify/              # QR code verification
│   ├── admin/                   # Admin dashboard
│   │   ├── logs/                # System logs
│   │   ├── system-settings/     # System settings
│   │   └── users/               # User management
│   ├── dashboard/               # User dashboard
│   │   ├── create/              # Create QR code
│   │   └── settings/            # User settings
│   ├── features/                # Features page
│   ├── login/                   # Login page
│   ├── payment/                 # Payment page
│   ├── pricing/                 # Pricing page
│   ├── register/                # Registration page
│   ├── terms/                   # Terms of service
│   ├── verify/                  # QR verification page
│   ├── layout.tsx               # Main layout
│   ├── page.tsx                 # Home page
│   └── globals.css              # Global styles
├── components/                   # React components
│   ├── ui/                      # UI components (shadcn/ui)
│   ├── home-header.tsx          # Home page header
│   └── theme-provider.tsx       # Theme provider
├── lib/                         # Helper libraries
│   ├── db/                      # Database
│   │   ├── models/              # Mongoose models
│   │   │   ├── anonymous-usage.ts
│   │   │   ├── qrcode-scan.ts
│   │   │   ├── qrcode.ts
│   │   │   └── user.ts
│   │   ├── index.ts
│   │   └── mongodb.ts
│   ├── admin-helpers.ts         # Admin helper functions
│   ├── api-client.ts            # Frontend API client
│   ├── auth-hooks.ts            # Authentication React Hooks
│   ├── auth.ts                  # Authentication functions
│   ├── config.ts                # App configurations
│   ├── db-seed.ts               # Database seed
│   ├── encryption.ts            # Encryption functions
│   ├── qr-generator.ts          # QR code generation
│   ├── toast-helper.ts          # Notification helper
│   └── utils.ts                 # General helper functions
├── hooks/                       # Custom React Hooks
├── scripts/                     # Helper scripts
│   ├── debug-users.js
│   ├── seed-db.ts
│   ├── setup-owner.ts
│   └── test-db.js
├── public/                      # Public files
├── styles/                      # CSS styles
├── middleware.ts                # Next.js Middleware
├── next.config.mjs             # Next.js configurations
├── package.json                # Project dependencies
├── tailwind.config.ts          # Tailwind configurations
├── tsconfig.json               # TypeScript configurations
└── README-OWNER.md             # Owner guide
```

---

## 🗄 Database Models (MongoDB)

### 1. User Model
```typescript
{
  _id?: string;
  name: string;
  email: string (unique);
  password: string (hashed);
  role: 'user' | 'admin';
  language: string;
  timezone: string;
  subscription: {
    plan: 'free' | 'premium' | 'enterprise';
    status: 'active' | 'inactive' | 'cancelled';
    expiresAt: Date;
  };
  apiKeys: {
    public: string;
    private: string;
  };
  apiPermissions: {
    createQRCode: boolean;
    viewStats: boolean;
    verifyQRCode: boolean;
  };
  securitySettings: {
    twoFactorEnabled: boolean;
    loginNotifications: boolean;
    trackQRCodeUsers: boolean;
  };
  notificationSettings: {
    scanNotifications: boolean;
    failedVerificationAlerts: boolean;
    expirationAlerts: boolean;
    newsletter: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}
```

### 2. QRCode Model
```typescript
{
  _id?: string;
  userId?: ObjectId (ref: User);
  name: string;
  description?: string;
  data: string;
  encryptedData: string;
  verificationCode: string;
  isActive: boolean;
  expiresAt?: Date;
  useLimit?: number;
  useCount: number;
  anonymousCreation?: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### 3. QRCodeScan Model
```typescript
{
  _id?: string;
  qrCodeId: ObjectId (ref: QRCode);
  scanDate: Date;
  ipAddress?: string;
  userAgent?: string;
  location?: {
    latitude?: number;
    longitude?: number;
    country?: string;
    city?: string;
  };
  status: 'valid' | 'invalid' | 'expired';
  createdAt: Date;
  updatedAt: Date;
}
```

### 4. AnonymousUsage Model
```typescript
{
  _id?: string;
  ipAddress: string (indexed);
  userAgent: string;
  count: number;
  lastUsed: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 🔐 Security & Encryption System

### 1. Authentication
- *JWT Tokens*: Using jose library for Edge Runtime compatibility
- *Cookie-based*: Tokens stored in httpOnly cookies
- *Expiration*: 30 days
- *Verification*: Middleware for session verification

### 2. Encryption
- *Password Hashing*: bcrypt with 10 rounds
- *Data Encryption*: AES-256
- *Digital Signatures*: HMAC SHA256
- *Timestamp Protection*: Timestamp stamping to prevent replay attacks
- *Tamper-Proof Tokens*: Anti-tampering tokens
- *Double Signature*: Double signing for enhanced security

### 3. Anti-Tampering Protection
- Unique UUID for each QR code
- Timestamp for time verification
- Digital Signature for authenticity verification
- Tamper-Proof Token for tampering detection

---

## 🚀 Key Features

### For Regular Users:
1. ✅ Create encrypted QR codes without registration (20 free codes)
2. ✅ Multiple encryption algorithms (AES-256, RSA, SHA-256)
3. ✅ Customize QR code appearance (colors, patterns, logos)
4. ✅ Advanced settings (expiration, usage limit)
5. ✅ Track scans and statistics
6. ✅ Verify QR codes (upload image or camera)
7. ✅ Download and share QR codes

### For Registered Users:
1. ✅ Unlimited QR codes
2. ✅ Save and manage all QR codes
3. ✅ Comprehensive dashboard
4. ✅ Detailed statistics for each QR code
5. ✅ Complete scan history
6. ✅ Advanced account settings
7. ✅ API Keys (for paid plans)

### For Admins:
1. ✅ Full administrative dashboard
2. ✅ Manage all users
3. ✅ Complete system statistics
4. ✅ System settings
5. ✅ View scan logs
6. ✅ Change subscription plans
7. ✅ Delete/edit users

### For Owner:
1. 👑 Permanent privileges that cannot be removed
2. 👑 Permanent Enterprise plan activated
3. 👑 Automatic privilege updates
4. 👑 Special "Owner Dashboard" interface
5. 👑 Full API endpoints and settings access

---

## 🔄 API Routes (Endpoints)

### Authentication APIs:
- POST /api/register - Register new user
- POST /api/login - User login
- POST /api/logout - User logout
- GET /api/user/me - Get current user data
- PUT /api/user/settings - Update user settings
- POST /api/user/settings - Regenerate API Keys

### QR Code APIs:
- POST /api/generate - Generate new QR code
- GET /api/qrcodes - Get all user QR codes
- GET /api/qrcodes/[id] - Get specific QR code
- GET /api/qrcodes/[id]/stats - Get QR code statistics
- DELETE /api/qrcodes/[id] - Delete QR code
- POST /api/verify - Verify QR code validity

### Admin APIs:
- GET /api/admin/users - Get all users
- GET /api/admin/users/[id] - Get specific user
- PUT /api/admin/users/[id] - Update user
- DELETE /api/admin/users/[id] - Delete user
- GET /api/admin/settings - Get system settings
- PUT /api/admin/settings - Update system settings
- GET /api/admin/owner - Check owner privileges

### Usage APIs:
- POST /api/usage/anonymous - Record anonymous usage

---

## 🎨 Pages (UI)

### Public Pages:
- / - Home page
- /features - Features page
- /pricing - Pricing page
- /contact - Contact us
- /terms - Terms and conditions
- /login - Login page
- /register - Registration page
- /verify - QR verification page

### Dashboard:
- /dashboard - Main dashboard
- /dashboard/create - Create QR code (available to all)
- /dashboard/settings - Account settings

### Admin Panel:
- /admin - Administrative dashboard
- /admin/users - User management
- /admin/users/[id] - Edit specific user
- /admin/system-settings - System settings
- /admin/logs - System logs

---

## 🔧 Middleware & Protection

### Protected Routes:
- /dashboard/* (except /dashboard/create)
- /admin/*
- /api/qrcodes/*
- /api/admin/*

### Redirect Routes for Authenticated Users:
- /login
- /register

### JWT Verification:
- Using jose (Edge-compatible)
- Cookie verification
- Appropriate page redirects

---

## 👤 Owner System

*Email*: karim-it@outlook.sa
*Default Password*: SecureQR@2024

### Special Features:
1. *Permanent Privileges*: Owner role cannot be changed
2. *Enterprise Plan*: Always active and permanent
3. *Automatic Updates*: ensureOwnerPrivileges() ensures privileges
4. *Special Interface*: "Owner Dashboard" with golden crown 👑
5. *Full Access*: All API endpoints and settings

### Owner Scripts:
```bash
npm run setup-owner   # Setup/update owner account
npm run seed          # Seed database
```

---

## 📊 Subscription Plans

### 1. Free Plan
- 20 QR codes for unregistered users
- Limited QR codes for registered users
- Basic features

### 2. Premium Plan
- Unlimited QR codes
- API Keys
- Advanced statistics
- Priority support

### 3. Enterprise Plan
- All Premium features
- Full API
- Complete customization
- Dedicated support

---

## 🌐 Internationalization (i18n)

- *Default Language*: Arabic (RTL)
- *dir="rtl"* in HTML
- *lang="ar"* in HTML
- All text in Arabic
- User settings support additional languages

---

## 🔒 Security Features

1. *Password Security*:
   - bcrypt hashing
   - Minimum length requirements
   - Password complexity

2. *Session Management*:
   - JWT tokens
   - httpOnly cookies
   - Secure cookies in production
   - SameSite protection

3. *CSRF Protection*:
   - SameSite cookies
   - Origin validation

4. *XSS Protection*:
   - React's built-in escaping
   - Content Security Policy headers

5. *Rate Limiting*:
   - Free usage limit (20 codes)
   - IP address tracking

---

## 📱 Responsive Design

- *Mobile-first approach*
- *Breakpoints*: sm, md, lg, xl, 2xl
- *Responsive components*: tables, forms, cards
- *Collapsible sidebars*
- *Touch optimization*

---

## 🧪 Testing & Development

### Environment Variables:
```env
MONGODB_URI=mongodb+srv://...
NEXTAUTH_SECRET=your-jwt-secret
API_PRIVATE_KEY=your-encryption-key
NODE_ENV=development|production
```

### Scripts:
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Lint code
npm run seed         # Seed database
npm run setup-owner  # Setup owner account
```

---

## 📈 Statistics & Analytics

### Dashboard Statistics:
- Total QR codes
- Verification operations
- Active QR codes
- Account status

### Admin Statistics:
- Total users
- Total QR codes
- Paid subscribers
- Scan operations
- Plan distribution
- Monthly growth

---

## 🎯 Future Features

❌ Two-Factor Authentication (2FA)

❌ Geographic Restrictions (Geo-restriction)

❌ Device Restrictions

❌ Data Export

❌ API Documentation

❌ Webhook Integration

❌ Multi-language Support

❌ Dark/Light Mode Toggle

❌ Add instant notifications within the system

❌ Add a feature for password change requests from users with instant notification to the owner to change the password for the user from within the system or send a password change link to the user via email

---

## ⚙ Configurations

### Next.js Config:
```javascript
- ESLint: ignoreDuringBuilds
- TypeScript: ignoreBuildErrors
- Images: unoptimized
- Experimental: allowedDevOrigins
```

### Tailwind Config:
- Custom colors
- Custom animations
- RTL support
- Dark mode support

---

## 📚 Main Libraries

```json
{
  "next": "15.2.4",
  "react": "19",
  "mongodb": "6.16.0",
  "mongoose": "8.15.0",
  "bcrypt": "6.0.0",
  "jose": "^6.0.11",
  "crypto-js": "latest",
  "qrcode": "latest",
  "html5-qrcode": "2.3.8",
  "tailwindcss": "3.4.17",
  "typescript": "5"
}
```

---

## 🐛 Known Issues & Limitations

1. ⚠ API Keys available only for paid plans
2. ⚠ QR verification works in simulation mode when server fails
3. ⚠ Some advanced settings features not fully activated
4. ⚠ Payment system not completed

---

## 🔐 Test Accounts

### System Owner:
- *Email*: karim-it@outlook.sa
- *Password*: SecureQR@2024
- *Role*: admin
- *Plan*: enterprise

---

## 📞 Support & Contact

- *Email*: info@secureqr.com (example)
- *Documentation*: README-OWNER.md
- *Admin Panel*: /admin

---

This is a comprehensive report covering all aspects of the project. The project is built professionally with great attention to security and encryption, and includes an advanced management system with multi-level permissions.
