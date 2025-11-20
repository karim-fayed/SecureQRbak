# SecureQR API Documentation

## Base URL
```
http://localhost:3000/api
```

## Authentication
Most endpoints require authentication via JWT token in cookies (`auth-token`).

## Endpoints

### Authentication

#### POST /api/login
Login user with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "_id": "user_id",
    "name": "User Name",
    "email": "user@example.com",
    "role": "user|admin",
    "subscription": {
      "plan": "free|premium|enterprise",
      "status": "active|inactive"
    },
    "apiKeys": {
      "public": "public_key",
      "private": "private_key"
    }
  }
}
```

#### POST /api/register
Register new user.

**Request Body:**
```json
{
  "name": "User Name",
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "_id": "user_id",
    "name": "User Name",
    "email": "user@example.com"
  }
}
```

#### POST /api/logout
Logout user.

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

#### POST /api/forgot-password
Request password reset.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset link sent to your email"
}
```

### QR Code Management

#### POST /api/generate
Generate new QR code.

**Request Body:**
```json
{
  "name": "QR Code Name",
  "data": "encrypted_data",
  "expiresAt": "2024-12-31T23:59:59Z",
  "verificationCode": "unique_code"
}
```

**Response:**
```json
{
  "success": true,
  "qrCode": {
    "_id": "qr_id",
    "name": "QR Code Name",
    "verificationCode": "unique_code",
    "createdAt": "2024-01-01T00:00:00Z",
    "expiresAt": "2024-12-31T23:59:59Z",
    "useCount": 0
  }
}
```

#### GET /api/qrcodes
Get user's QR codes.

**Response:**
```json
{
  "success": true,
  "qrCodes": [
    {
      "_id": "qr_id",
      "name": "QR Code Name",
      "verificationCode": "unique_code",
      "createdAt": "2024-01-01T00:00:00Z",
      "expiresAt": "2024-12-31T23:59:59Z",
      "useCount": 0,
      "status": "active|expired"
    }
  ]
}
```

#### GET /api/qrcodes/[id]
Get specific QR code details.

**Response:**
```json
{
  "success": true,
  "qrCode": {
    "_id": "qr_id",
    "name": "QR Code Name",
    "verificationCode": "unique_code",
    "createdAt": "2024-01-01T00:00:00Z",
    "expiresAt": "2024-12-31T23:59:59Z",
    "useCount": 0,
    "encryptedData": "encrypted_data"
  }
}
```

#### DELETE /api/qrcodes/[id]
Delete QR code.

**Response:**
```json
{
  "success": true,
  "message": "QR code deleted successfully"
}
```

#### GET /api/qrcodes/[id]/stats
Get QR code statistics.

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalScans": 150,
    "validScans": 140,
    "invalidScans": 5,
    "expiredScans": 5,
    "recentScans": [
      {
        "_id": "scan_id",
        "scanDate": "2024-01-01T00:00:00Z",
        "status": "valid|invalid|expired",
        "location": {
          "city": "City",
          "country": "Country",
          "ipAddress": "192.168.1.1"
        }
      }
    ]
  }
}
```

### Verification

#### GET /api/verify
Verify QR code.

**Query Parameters:**
- `code`: verification code

**Response:**
```json
{
  "success": true,
  "data": "decrypted_data",
  "qrCode": {
    "_id": "qr_id",
    "name": "QR Code Name",
    "verificationCode": "unique_code"
  },
  "scan": {
    "_id": "scan_id",
    "scanDate": "2024-01-01T00:00:00Z",
    "location": {
      "city": "City",
      "country": "Country",
      "ipAddress": "192.168.1.1"
    }
  }
}
```

### User Management

#### GET /api/user/me
Get current user profile.

**Response:**
```json
{
  "success": true,
  "user": {
    "_id": "user_id",
    "name": "User Name",
    "email": "user@example.com",
    "role": "user|admin",
    "subscription": {
      "plan": "free|premium|enterprise",
      "status": "active|inactive"
    },
    "apiKeys": {
      "public": "public_key",
      "private": "private_key"
    },
    "notificationSettings": {
      "scanNotifications": true,
      "failedVerificationAlerts": true,
      "expirationAlerts": true,
      "newsletter": false
    }
  }
}
```

#### PUT /api/user/settings
Update user settings.

**Request Body:**
```json
{
  "notificationSettings": {
    "scanNotifications": true,
    "failedVerificationAlerts": true,
    "expirationAlerts": true,
    "newsletter": false
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Settings updated successfully"
}
```

### Usage Statistics

#### GET /api/usage/anonymous
Get anonymous usage statistics.

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalQRCodes": 1000,
    "totalScans": 50000,
    "activeQRCodes": 800,
    "totalUsers": 500
  }
}
```

### Admin Endpoints

#### GET /api/admin/users
Get all users (Admin only).

**Response:**
```json
{
  "success": true,
  "users": [
    {
      "_id": "user_id",
      "name": "User Name",
      "email": "user@example.com",
      "role": "user|admin",
      "subscription": {
        "plan": "free|premium|enterprise",
        "status": "active|inactive"
      },
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### GET /api/admin/users/[id]
Get specific user details (Admin only).

**Response:**
```json
{
  "success": true,
  "user": {
    "_id": "user_id",
    "name": "User Name",
    "email": "user@example.com",
    "role": "user|admin",
    "subscription": {
      "plan": "free|premium|enterprise",
      "status": "active|inactive"
    },
    "apiKeys": {
      "public": "public_key",
      "private": "private_key"
    },
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

#### PUT /api/admin/users/[id]
Update user (Admin only).

**Request Body:**
```json
{
  "name": "New Name",
  "email": "newemail@example.com",
  "role": "admin",
  "subscription": {
    "plan": "enterprise",
    "status": "active"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "User updated successfully"
}
```

#### DELETE /api/admin/users/[id]
Delete user (Admin only).

**Response:**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

#### GET /api/admin/notifications
Get admin notifications (Admin only).

**Response:**
```json
{
  "success": true,
  "notifications": {
    "passwordResetRequests": [
      {
        "id": "request_id",
        "type": "password_reset_request",
        "title": "Password reset request",
        "message": "User requested password reset",
        "timestamp": "2024-01-01T00:00:00Z",
        "userName": "User Name",
        "userEmail": "user@example.com"
      }
    ]
  },
  "stats": {
    "pending": 5,
    "approved": 10,
    "rejected": 2,
    "total": 17
  }
}
```

#### POST /api/admin/notifications
Send batch notifications (Admin only).

**Request Body:**
```json
{
  "emails": ["user1@example.com", "user2@example.com"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "تم إرسال 2 إشعار بنجاح، فشل 0",
  "results": [
    {
      "email": "user1@example.com",
      "success": true
    },
    {
      "email": "user2@example.com",
      "success": true
    }
  ]
}
```

#### GET /api/admin/password-reset-requests
Get password reset requests (Admin only).

**Response:**
```json
{
  "success": true,
  "requests": [
    {
      "_id": "request_id",
      "userName": "User Name",
      "userEmail": "user@example.com",
      "requestedAt": "2024-01-01T00:00:00Z",
      "status": "pending|approved|rejected"
    }
  ]
}
```

#### POST /api/admin/password-reset-requests/[id]/approve
Approve password reset request (Admin only).

**Response:**
```json
{
  "success": true,
  "message": "Password reset request approved"
}
```

#### POST /api/admin/password-reset-requests/[id]/reject
Reject password reset request (Admin only).

**Response:**
```json
{
  "success": true,
  "message": "Password reset request rejected"
}
```

#### GET /api/admin/settings
Get system settings (Admin only).

**Response:**
```json
{
  "success": true,
  "settings": {
    "systemName": "SecureQR",
    "allowRegistration": true,
    "emailNotifications": true,
    "maintenanceMode": false
  }
}
```

#### PUT /api/admin/settings
Update system settings (Admin only).

**Request Body:**
```json
{
  "systemName": "SecureQR",
  "allowRegistration": true,
  "emailNotifications": true,
  "maintenanceMode": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "Settings updated successfully"
}
```

### Testing

#### POST /api/test-email
Test email configuration.

**Request Body:**
```json
{
  "email": "test@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Test email sent successfully"
}
```

## Error Responses

All endpoints return errors in the following format:

```json
{
  "error": "Error message in Arabic",
  "status": 400|401|403|404|500
}
```

## Rate Limiting

- Authentication endpoints: 5 requests per minute
- QR generation: 10 requests per minute per user
- Verification: 100 requests per minute
- Admin endpoints: 30 requests per minute

## Mobile App Integration

### Authentication Flow
1. Register/Login via API
2. Store JWT token in app storage
3. Include token in all subsequent requests

### QR Code Generation
1. Generate QR code via `/api/generate`
2. Display QR code in app
3. Handle verification via `/api/verify`

### Real-time Updates
- Use polling for notifications (`/api/admin/notifications`)
- Check user profile updates (`/api/user/me`)

### Error Handling
- Handle network errors gracefully
- Show user-friendly error messages
- Implement retry logic for failed requests

### Security Best Practices
- Store tokens securely (Keychain/iOS, Keystore/Android)
- Use HTTPS in production
- Validate SSL certificates
- Implement token refresh logic
- Encrypt sensitive data locally
