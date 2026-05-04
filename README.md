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

## Agent Profile API

These endpoints are for authenticated agent users (b2b/b2c) to view and update their own profile.

### Get My Profile

- Endpoint: `GET /api/profile/me`
- Access: agent only

### Update My Profile

- Endpoint: `PUT /api/profile/me`
- Access: agent only
- Updatable fields:
  - `firstName`
  - `lastName`
  - `email`
  - `businessType` (`b2b` or `b2c`)
  - `profileImage` (image URL/path)
  - `supportingDocument1` (URL/path)
  - `supportingDocument2` (URL/path)

Example body:

```json
{
  "firstName": "Arun",
  "lastName": "Kumar",
  "email": "arun.b2b@example.com",
  "businessType": "b2b",
  "profileImage": "/uploads/profile-arun.png",
  "supportingDocument1": "/uploads/doc1-updated.pdf",
  "supportingDocument2": "/uploads/doc2-updated.pdf"
}
```

### Reset Password From Profile

- Endpoint: `PUT /api/profile/reset-password`
- Access: agent only
- Required fields:
  - `currentPassword`
  - `newPassword`
  - `confirmPassword`

Example body:

```json
{
  "currentPassword": "Old@1234",
  "newPassword": "New@1234",
  "confirmPassword": "New@1234"
}
```

## Public Complaint API

### Submit Complaint (Public)

- Endpoint: `POST /api/complaints/public`
- Access: public (no auth)
- Required fields:
  - `firstName`
  - `lastName`
  - `emailAddress`
  - `phoneNumber`
  - `countryOfResidence`
  - `agentNameOrCompany`
  - `typeOfComplaint`
  - `description`
  - `acceptedDeclaration` (must be `true`)

Optional fields:

- `aegaReferenceNumber`
- `evidenceFiles`: array of `{ "fileUrl": "...", "fileName": "..." }`

Example body:

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "emailAddress": "john.doe@example.com",
  "phoneNumber": "+1 123 456 7890",
  "countryOfResidence": "India",
  "agentNameOrCompany": "ABC Agency",
  "aegaReferenceNumber": "AEGA-REF-001",
  "typeOfComplaint": "Misleading Information",
  "description": "Detailed complaint description goes here.",
  "evidenceFiles": [
    {
      "fileUrl": "/uploads/complaints/evidence-1.pdf",
      "fileName": "receipt.pdf"
    }
  ],
  "acceptedDeclaration": true
}
```

### Get Complaints (Admin)

- Endpoint: `GET /api/complaints/admin`
- Access: admin only

## Student Management API

### Add Student

- Endpoint: `POST /api/students`
- Access: authenticated agent
- Required fields:
  - `firstName`
  - `lastName`
  - `emailId` (or `email`)
  - `mobileNumber` (or `phoneNumber`)

Optional sections (arrays):

- `tenthInformation`
- `twelfthInformation`
- `graduationInformation`
- `postGraduationInformation`
- `employmentInformation`
- `preferredRegionAndCollege`

Example body:

```json
{
  "firstName": "Jane",
  "lastName": "Lorence",
  "emailId": "jane@gmail.com",
  "mobileNumber": "+1 123 589 6740",
  "tenthInformation": [
    {
      "schoolName": "School Name",
      "boardName": "Board Name",
      "percentage": "82.33%",
      "yearOfPassing": "2019"
    }
  ],
  "graduationInformation": [
    {
      "schoolOrCollege": "School Name",
      "streamOrSpecialization": "Stream",
      "cgpaOrPercentage": "82.33%",
      "yearOfPassing": "2022"
    }
  ],
  "postGraduationInformation": [
    {
      "schoolOrCollege": "School Name",
      "streamOrSpecialization": "Stream",
      "cgpaOrPercentage": "82.33%",
      "yearOfPassing": "2024"
    }
  ],
  "employmentInformation": [
    {
      "companyName": "XYZ",
      "role": "Designer",
      "emailId": "jane@gmail.com",
      "phoneNumber": "+1 123 589 6740",
      "startDate": "2024",
      "endDate": "2025",
      "currentlyWorkingHere": false
    }
  ],
  "preferredRegionAndCollege": [
    {
      "region": "XYZ",
      "country": "India",
      "collegeName": "Name"
    }
  ]
}
```

### Get All Students

- Endpoint: `GET /api/students`
- Access: authenticated user
- Behavior:
  - agent sees own students
  - admin sees all students

### Get Student By ID

- Endpoint: `GET /api/students/:studentId`
- Access: authenticated user
- Behavior:
  - agent can view own student only
  - admin can view any student

### Edit Student

- Endpoint: `PUT /api/students/:studentId`
- Access: authenticated user (owner agent or admin)
- Restriction:
  - `emailId` cannot be changed during edit.

Example body:

```json
{
  "firstName": "Jane",
  "lastName": "Updated",
  "mobileNumber": "+1 111 222 3333",
  "graduationInformation": [
    {
      "schoolOrCollege": "School Name",
      "streamOrSpecialization": "Stream",
      "cgpaOrPercentage": "85%",
      "yearOfPassing": "2023"
    }
  ]
}
```

### Delete Student

- Endpoint: `DELETE /api/students/:studentId`
- Access: authenticated user (owner agent or admin)
- Mail restriction:
  - If `emailId` or `email` is sent in request body, it must match the student's saved email.

Example body (optional verification):

```json
{
  "emailId": "jane@gmail.com"
}
```

### Add University Preference

- Endpoint: `POST /api/students/:studentId/preferences`
- Access: authenticated user (owner agent or admin)
- Required fields:
  - `universityName`

Example body:

```json
{
  "universityName": "Loughborough University",
  "courseName": "MSC Human-Computer Interaction",
  "region": "East Midlands",
  "country": "United Kingdom",
  "location": "Loughborough",
  "eligibilityStatus": "Eligible",
  "applicationStatus": "On-Going",
  "intakeDate": "September 2026",
  "startDate": "2026-09-21",
  "endDate": "2027-09-21",
  "tuitionFee": "£27,300",
  "firstTermFee": "£4,300",
  "logoUrl": "https://example.com/logo.png",
  "universityEmail": "admissions@lboro.ac.uk"
}
```

### Get University Preferences

- Endpoint: `GET /api/students/:studentId/preferences`
- Access: authenticated user (owner agent or admin)
- Response: Array of all university preferences for the student

### Edit University Preference

- Endpoint: `PUT /api/students/:studentId/preferences/:preferenceId`
- Access: authenticated user (owner agent or admin)
- Fields: All preference fields are optional and can be updated

Example body:

```json
{
  "applicationStatus": "Accepted",
  "eligibilityStatus": "Conditional Offer"
}
```

### Reorder University Preferences

- Endpoint: `PUT /api/students/:studentId/preferences/reorder`
- Access: authenticated user (owner agent or admin)
- Body: `orderedPreferenceIds` — an array of preference `_id` values in the desired order. The array length must exactly match the existing preferences length.

Example body:

```json
{
  "orderedPreferenceIds": [
    "64e8c3d4f8f9a1b2c3d4e5f6",
    "64e8c3d4f8f9a1b2c3d4e5f7",
    "64e8c3d4f8f9a1b2c3d4e5f8"
  ]
}
```

Alternative (single-move) body — move one preference to a new position (1-based indices):

```json
{
  "id": "6954f467b3e301509184d93f",
  "from": 3,
  "to": 1
}
```

Notes:

- `from` and `to` are 1-based positions (example: `from:3` moves the item currently at position 3).
- The server validates the `id` belongs to the student and the `to` index is within range.

### Delete University Preference

- Endpoint: `DELETE /api/students/:studentId/preferences/:preferenceId`
- Access: authenticated user (owner agent or admin)
- Response: Success message upon deletion

### Add Profile Document

- Endpoint: `POST /api/profile/documents`
- Access: agent only
- Required fields:
  - `documentName`
  - `fileUrl`

Example body:

```json
{
  "documentName": "Passport",
  "fileUrl": "/uploads/passport.pdf"
}
```

### Admin Login

- Endpoint: `POST /auth/admin/login`
- Content-Type: `application/json`
- Required fields:
  - `email`
  - `password`

Default dev credentials if `ADMIN_EMAIL` and `ADMIN_PASSWORD` are not set:

- Email: `admin@example.com`
- Password: `Admin@1234`

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

## Company Management API

These endpoints require a valid `Bearer` token from `POST /auth/login` and are limited to users with role `agent`.

### Create Company

- Endpoint: `POST /api/companies`
- Content-Type: `application/json`
- Required fields:
  - `companyName`
  - `founderName`
  - `emailId`
  - `mobileNumber`
  - `designation`
  - `office`
  - `country`
  - `companyDocument1`
  - `companyDocument2`

Example request body:

```json
{
  "companyName": "Jane Enterprises",
  "founderName": "Lorence",
  "emailId": "jane@gmail.com",
  "mobileNumber": "+1 123 589 6740",
  "designation": "Designation Name",
  "office": "Location",
  "country": "Region Name",
  "companyDocument1": "/uploads/company-doc-1.pdf",
  "companyDocument2": "/uploads/company-doc-2.pdf"
}
```

### Get Companies

- Endpoint: `GET /api/companies`
- Returns all companies created by the authenticated agent.

### Get Company Overview (Info tab + graph values)

- Endpoint: `GET /api/companies/:companyId/overview`
- Access: authenticated agent (owner) or admin/sponsor

### Update Company Graph Values (Admin)

- Endpoint: `PUT /api/companies/:companyId/performance`
- Access: admin/sponsor only
- Body shape:

```json
{
  "performanceMatrix": {
    "visaRefusal": { "weekly": 75, "monthly": 70, "yearly": 65, "max": 75 },
    "enrollment": { "weekly": 24, "monthly": 35, "yearly": 45, "max": 75 },
    "withdrawnStudent": { "weekly": 1, "monthly": 10, "yearly": 15, "max": 75 }
  }
}
```

## CDP Training API

Admin controls CDP course creation, edit, delete, and detailed view. Agents can only list courses.

### Create CDP Course (Admin)

- Endpoint: `POST /api/admin/cdp-courses`
- Access: admin/sponsor only
- Required fields:
  - `courseName`
  - `type` (`mandatory` or `optional`)
  - `timeInHr`
  - `modules`
  - `hyperLink`
  - `description`
  - `coverPicture`

Example body:

```json
{
  "courseName": "Student Conversion Mastery",
  "type": "mandatory",
  "timeInHr": 20,
  "modules": 8,
  "hyperLink": "https://example.com/courses/student-conversion",
  "description": "Hands-on modules focused on enrollment conversion and counseling frameworks.",
  "coverPicture": "/uploads/cdp-cover-student-conversion.png"
}
```

### List CDP Courses (All Agents)

- Endpoint: `GET /api/cdp-courses`
- Access: agent only

### Get All CDP Courses (Admin)

- Endpoint: `GET /api/admin/cdp-courses`
- Access: admin only

### View Single CDP Course (Admin)

- Endpoint: `GET /api/admin/cdp-courses/:courseId`
- Access: admin only

### Edit CDP Course (Admin)

- Endpoint: `PUT /api/admin/cdp-courses/:courseId`
- Access: admin only

### Delete CDP Course (Admin)

- Endpoint: `DELETE /api/admin/cdp-courses/:courseId`
- Access: admin only

## Agent Management API

B2B and B2C agents can manage their own agent records based on authorization flags. The API auto-generates a password and sends credentials to the agent email.

### Add Agent (Admin)

- Endpoint: `POST /api/agent-management`
- Access: authenticated b2b/b2c agent with `addAgent` permission
- Required fields:
  - `firstName`
  - `lastName`
  - `emailId`
  - `mobileNumber`
  - `designation`
  - `office`
  - `country`
  - `authorization` object with action flags

Example body:

```json
{
  "firstName": "Jane",
  "lastName": "Lorence",
  "emailId": "jane@gmail.com",
  "mobileNumber": "+1 123 589 6740",
  "designation": "Designation Name",
  "office": "Location",
  "country": "Region Name",
  "authorization": {
    "addAgent": true,
    "editAgent": true,
    "assignUni": true,
    "addOffice": true,
    "editOffice": true,
    "removeOffice": true,
    "assignRegion": true,
    "assignCourse": true,
    "removeAgent": false
  }
}
```

### Get All Agents (Admin)

- Endpoint: `GET /api/agent-management`
- Access: authenticated b2b/b2c agent

### View Agent by ID (Admin)

- Endpoint: `GET /api/agent-management/:agentId`
- Access: authenticated b2b/b2c agent

### Edit Agent (Admin)

- Endpoint: `PUT /api/agent-management/:agentId`
- Access: authenticated b2b/b2c agent with `editAgent` permission

### Delete Agent (Admin)

- Endpoint: `DELETE /api/agent-management/:agentId`
- Access: authenticated b2b/b2c agent with `removeAgent` permission

## University Management API

Universities can self-register and manage their own profiles. Agents and admins can view the list of available universities when adding student preferences.

### List All Active Universities (Public)

- Endpoint: `GET /api/universities`
- Access: public (no auth required)
- Response: Array of all active universities with basic info (name, email, region, country, logo, coursesOffered)

Example response:

```json
[
  {
    "_id": "64e8c3d4f8f9a1b2c3d4e5f6",
    "name": "Loughborough University",
    "email": "admissions@lboro.ac.uk",
    "region": "East Midlands",
    "country": "United Kingdom",
    "logo": "/uploads/lboro-logo.png",
    "coursesOffered": ["MSC Human-Computer Interaction", "MSC Computer Science"]
  }
]
```

### Get University Details

- Endpoint: `GET /api/universities/:universityId`
- Access: public
- Response: Full university profile

### Create University Profile (First Time Setup)

- Endpoint: `POST /api/universities/me/profile`
- Access: authenticated university user
- Required fields:
  - `name`
  - `email`

Optional fields:

- `phone`
- `website`
- `region`
- `country`
- `city`
- `logo`
- `accreditation`
- `coursesOffered` (array)
- `description`

Example body:

```json
{
  "name": "Loughborough University",
  "email": "admissions@lboro.ac.uk",
  "phone": "+44 1509 263171",
  "website": "https://www.lboro.ac.uk",
  "region": "East Midlands",
  "country": "United Kingdom",
  "city": "Loughborough",
  "logo": "/uploads/lboro-logo.png",
  "accreditation": "Russell Group",
  "coursesOffered": [
    "MSC Human-Computer Interaction",
    "MSC Computer Science",
    "MSC Mechanical Engineering"
  ],
  "description": "A leading research university in the UK"
}
```

### Get My University Profile

- Endpoint: `GET /api/universities/me/profile`
- Access: authenticated university user
- Response: Full profile of the authenticated university

### Update My University Profile

- Endpoint: `PUT /api/universities/:universityId`
- Access: authenticated university user (profile owner or admin)
- Updatable fields: name, phone, website, region, country, city, logo, accreditation, coursesOffered, description, status (admin only)

Example body:

```json
{
  "phone": "+44 1509 263172",
  "coursesOffered": [
    "MSC Human-Computer Interaction",
    "MSC Computer Science",
    "MSC Mechanical Engineering",
    "MSC Biomedical Engineering"
  ]
}
```

---

Replace placeholders and add more features as needed.
