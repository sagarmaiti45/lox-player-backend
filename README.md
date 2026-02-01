# Lox Player Backend

Node.js/Express backend API with PostgreSQL database and admin panel for Lox Player cloud storage application.

## Features

- 🔐 JWT-based authentication with refresh tokens
- 📧 Email verification system
- 🔑 Password reset functionality
- 👨‍💼 Admin panel for user and file management
- 🛡️ Rate limiting and security middleware
- 💾 PostgreSQL database with Railway deployment support
- 📊 Dashboard with statistics and analytics

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **View Engine**: EJS (for admin panel)
- **Authentication**: JWT (jsonwebtoken)
- **Email**: Nodemailer
- **Security**: Helmet, express-rate-limit
- **Password Hashing**: bcryptjs

## Installation

1. Install dependencies:
```bash
cd backend
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Update `.env` with your configuration:
   - Set `DATABASE_URL` with your Railway PostgreSQL connection string
   - Configure SMTP settings for email sending
   - Set JWT secrets
   - Configure admin credentials

4. Run database migrations:
```bash
npm run migrate
```

This will create all necessary tables and a default admin user.

## Running the Server

### Development mode:
```bash
npm run dev
```

### Production mode:
```bash
npm start
```

The server will start on `http://localhost:3000` (or the PORT specified in .env)

## API Endpoints

### Authentication (`/api/v1/auth`)

- `POST /signup` - Create new user account
- `POST /signin` - Sign in with email and password
- `POST /signout` - Sign out current user
- `POST /refresh` - Refresh access token
- `GET /me` - Get current user data (requires auth)
- `POST /resend-verification` - Resend verification email (requires auth)
- `GET /verify-email?token=xxx` - Verify email address
- `POST /reset-password` - Request password reset
- `POST /reset-password/confirm` - Confirm password reset
- `POST /update-password` - Update password (requires auth)

### Admin Panel (`/admin`)

- `GET /admin/login` - Admin login page
- `GET /admin/dashboard` - Dashboard with statistics
- `GET /admin/users` - Users list
- `GET /admin/users/:id` - User details
- `POST /admin/users/:id/delete` - Delete user
- `GET /admin/files` - Files list
- `GET /admin/logout` - Logout admin

## Database Schema

### Users Table
- `id` (UUID) - Primary key
- `email` (VARCHAR) - Unique email address
- `password_hash` (VARCHAR) - Hashed password
- `full_name` (VARCHAR) - User's full name
- `email_verified_at` (TIMESTAMP) - Email verification timestamp
- `verification_token` (VARCHAR) - Email verification token
- `verification_token_expires` (TIMESTAMP) - Token expiry
- `reset_token` (VARCHAR) - Password reset token
- `reset_token_expires` (TIMESTAMP) - Reset token expiry
- `created_at` (TIMESTAMP) - Account creation date
- `updated_at` (TIMESTAMP) - Last update date
- `last_login_at` (TIMESTAMP) - Last login date

### Refresh Tokens Table
- `id` (UUID) - Primary key
- `user_id` (UUID) - Foreign key to users
- `token` (VARCHAR) - Refresh token
- `expires_at` (TIMESTAMP) - Token expiry
- `created_at` (TIMESTAMP) - Creation date
- `revoked_at` (TIMESTAMP) - Revocation date

### Files Table
- `id` (UUID) - Primary key
- `user_id` (UUID) - Foreign key to users
- `file_name` (VARCHAR) - Original file name
- `file_size` (BIGINT) - File size in bytes
- `file_type` (VARCHAR) - File type
- `mime_type` (VARCHAR) - MIME type
- `r2_key` (VARCHAR) - Cloudflare R2 object key
- `r2_url` (TEXT) - R2 access URL
- `thumbnail_url` (TEXT) - Thumbnail URL (if applicable)
- `is_public` (BOOLEAN) - Public sharing status
- `share_token` (VARCHAR) - Sharing token
- `share_expires_at` (TIMESTAMP) - Share expiry
- `download_count` (INTEGER) - Download counter
- `created_at` (TIMESTAMP) - Upload date
- `updated_at` (TIMESTAMP) - Last update date

### Folders Table
- `id` (UUID) - Primary key
- `user_id` (UUID) - Foreign key to users
- `name` (VARCHAR) - Folder name
- `parent_folder_id` (UUID) - Parent folder reference
- `created_at` (TIMESTAMP) - Creation date
- `updated_at` (TIMESTAMP) - Last update date

### Admin Users Table
- `id` (UUID) - Primary key
- `email` (VARCHAR) - Admin email
- `password_hash` (VARCHAR) - Hashed password
- `name` (VARCHAR) - Admin name
- `role` (VARCHAR) - Admin role
- `created_at` (TIMESTAMP) - Creation date
- `last_login_at` (TIMESTAMP) - Last login date

## Deployment to Railway

1. Create a new Railway project
2. Add PostgreSQL database service
3. Add backend service from GitHub repo
4. Set environment variables in Railway dashboard
5. Deploy!

Railway will automatically:
- Install dependencies
- Start the server
- Provide HTTPS URL

## Security Features

- **JWT Authentication**: Secure token-based auth with refresh tokens
- **Rate Limiting**: Prevents brute force attacks
- **Password Hashing**: bcrypt with salt rounds
- **Helmet**: Security headers
- **CORS**: Configured for frontend origin
- **Input Validation**: express-validator for request validation
- **Session Security**: HttpOnly cookies for admin panel

## Email Templates

HTML email templates are included for:
- Email verification
- Password reset

Templates are styled with inline CSS for maximum email client compatibility.

## Admin Panel Access

After running migrations, access the admin panel at:
```
http://localhost:3000/admin
```

Default credentials (change after first login):
- Email: admin@loxplayer.com
- Password: admin123

(Or whatever you set in your .env file)

## Development Notes

- Use `nodemon` for development (auto-restart on file changes)
- Database migrations create all tables and indexes
- Refresh tokens are stored in database and can be revoked
- Email verification tokens expire after 24 hours
- Password reset tokens expire after 1 hour
- Rate limiting: 5 auth attempts per 15 minutes
- Email sending: 1 verification email per minute

## Environment Variables

See `.env.example` for all required environment variables.

## License

Private - Lox Player
