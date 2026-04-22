# AEGA Backend

Basic Node.js backend setup with Express and MongoDB (Mongoose).

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start development server:
   ```bash
   npm run dev
   ```
3. Or run production mode:
   ```bash
   npm start
   ```

## Project Structure

- `src/index.js`: Entry point
- `src/models/`: Mongoose models
- `src/controllers/`: Route controllers
- `src/routes/`: Express routes

## Environment Variables

- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Secret used to sign auth tokens
- `JWT_EXPIRE`: Token expiry (example: `1d`, `12h`)
- `ANTRYK_ACCESS_KEY`: Antryk access key
- `ANTRYK_SECRET_KEY`: Antryk secret key
- `ANTRYK_BUCKET_NAME`: Target bucket (example: `divine-care`)
- `ANTRYK_BASE_URL`: Public base URL for files (example: `https://divine-care.ap-south-1.storage.onantryk.com`)
- `ANTRYK_UPLOAD_URL`: Optional upload endpoint override (default: `https://storage.apis.antryk.com/api/v1/objects`)
- `SMTP_HOST`: SMTP server address (default: `smtp.gmail.com`)
- `SMTP_PORT`: SMTP port (default: `587`)
- `SMTP_SECURE`: SMTP use SSL/TLS (default: `false`)
- `EMAIL_USER`: Email account for sending OTPs
- `EMAIL_PASSWORD`: Email account password
- `EMAIL_FROM`: From address for emails (fallback to EMAIL_USER if not set)

## Authentication Flows

### Signup (Agent B2B / Agent B2C / University)

- Endpoint: `POST /auth/signup`
- Content-Type: `application/json`
- Required text fields:
  - `firstName`
  - `lastName`
  - `email`
  - `password`
  - `confirmPassword`
  - `role` (`agent` or `university`)
  - `businessType` (`b2b` or `b2c`) only when `role=agent` (must not be sent for `role=university`)
- Required document URL fields:
  - `supportingDocument1` (string path returned by upload API, for example `/uploads/file1.pdf`)
  - `supportingDocument2` (string path returned by upload API, for example `/uploads/file2.pdf`)

Example request body:

```json
{
  "firstName": "Arun",
  "lastName": "Kumar",
  "email": "arun.b2b@example.com",
  "password": "Test@1234",
  "confirmPassword": "Test@1234",
  "role": "agent",
  "businessType": "b2b",
  "supportingDocument1": "/uploads/doc1.pdf",
  "supportingDocument2": "/uploads/doc2.pdf"
}
```

### Login

- Endpoint: `POST /auth/login`
- Content-Type: `application/json`
- Required fields:
  - `email`
  - `password`

## Password Reset API

### Request Password Reset (Send OTP)

- Endpoint: `POST /api/password/request-reset`
- Content-Type: `application/json`
- Required fields:
  - `email`: User's registered email

Response:

```json
{
  "success": true,
  "message": "OTP sent to your registered email."
}
```

### Verify OTP

- Endpoint: `POST /api/password/verify-otp`
- Content-Type: `application/json`
- Required fields:
  - `email`: User's registered email
  - `otp`: OTP received in email

Response:

```json
{
  "success": true,
  "message": "OTP verified successfully. You can now reset your password.",
  "resetToken": "123456"
}
```

### Reset Password

- Endpoint: `POST /api/password/reset-password`
- Content-Type: `application/json`
- Required fields:
  - `email`: User's registered email
  - `otp`: OTP received in email
  - `newPassword`: New password
  - `confirmPassword`: Confirm new password

Response:

```json
{
  "success": true,
  "message": "Password reset successfully. You can now login with your new password."
}
```

### Login

- Endpoint: `POST /auth/login`
- Content-Type: `application/json`
- Required fields:
  - `email`
  - `password`

### Legacy User Routes

- `GET /api/users`
- `POST /api/users`

## Upload API (Antryk)

### Single Image Upload

- Endpoint: `POST /api/upload/public`
- Content-Type: `multipart/form-data`
- Field name: `file`
- Optional field: `folder` (default: `uploads`)
- Allowed file types: JPG, JPEG, PNG, WEBP, PDF

Response shape:

```json
{
  "success": true,
  "files": [
    {
      "key": "uploads/uuid_file.png",
      "url": "/uploads/uuid_file.png"
    }
  ]
}
```

### Multiple Image Upload

- Endpoint: `POST /api/upload/public/multiple`
- Content-Type: `multipart/form-data`
- Field name: `files` (up to 10 files)
- Optional field: `folder` (default: `uploads`)
- Allowed file types: JPG, JPEG, PNG, WEBP, PDF

---

Replace placeholders and add more features as needed.
