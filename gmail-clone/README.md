# Gmail Clone - MERN + Gmail API + SMTP

A production-style Gmail clone built with MERN stack and JWT auth.

## Features
- Signup/Login/Logout with HTTP-only cookie JWT auth
- Session restore (`/user/me`) and expired-token handling
- Compose email with `Primary` / `Updates` category
- Folder views: Inbox, Updates, Starred, Sent, Spam
- Unread/read behavior with bold unread rows
- Star/Spam/Delete actions
- Profile photo update
- Settings page with Gmail OAuth connect/disconnect
- Gmail API sync (read/spam/star/delete mirrored to real Gmail when connected)

## Tech Stack
- Frontend: React 18, Vite, Tailwind CSS, Redux Toolkit, React Router
- Backend: Node.js, Express, Mongoose
- DB: MongoDB Atlas
- Outbound email: Gmail API (preferred) or SMTP fallback

## Setup
### 1. Backend
```bash
cd backend
npm install
```

Create `backend/.env` from `backend/.env.example`:
```env
MONGO_URI=your_mongo_uri
SECRET_KEY=your_jwt_secret
PORT=8080
CLIENT_URL=http://localhost:5173

# SMTP fallback (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_sender@gmail.com
SMTP_PASS=your_16_char_app_password
SMTP_FROM=your_sender@gmail.com

# Gmail API OAuth (required for real Gmail sync actions)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=http://localhost:8080/api/v1/gmail/callback
```

Start backend:
```bash
npm run dev
```

### 2. Frontend
```bash
cd ../frontend
npm install
npm run dev
```

Frontend: `http://localhost:5173`
Backend: `http://localhost:8080`

## Gmail API Connect Flow
1. Login to the app.
2. Go to `Settings`.
3. Click `Connect Gmail`.
4. Complete Google consent screen.
5. You will be redirected back to settings.

After connecting Gmail:
- Inbox sync (`Reload`) imports from real Gmail inbox.
- Opening a mail marks it read in Gmail too.
- Mark spam/unspam and star/unstar sync to Gmail labels.
- Delete moves the original Gmail message to Trash (for Gmail-linked mails).

## API Endpoints
### User (`/api/v1/user`)
- `POST /register`
- `POST /login`
- `GET /me`
- `PATCH /profile-photo`
- `GET /logout`

### Gmail (`/api/v1/gmail`)
- `GET /status` (auth)
- `GET /connect-url` (auth)
- `GET /callback`
- `POST /disconnect` (auth)

### Email (`/api/v1/email`) (auth required)
- `POST /create`
- `POST /sync`
- `GET /getallemails`
- `GET /:id`
- `PATCH /:id`
- `DELETE /:id`

## Notes
- Without Gmail OAuth, app still works using local data + SMTP/IMAP fallback.
- Real Gmail-side delete/update applies only to messages linked with Gmail API IDs.

## Security Notes
- Never commit `.env` files.
- Rotate SMTP app passwords if exposed.
- Use strong `SECRET_KEY` in production.

## License
MIT
