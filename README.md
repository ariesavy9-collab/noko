# Noko Mashaba

A responsive creator channel built with React (Create React App, not Vite) and an Express/MongoDB backend.

## Requirements

- Node.js 18 or newer
- MongoDB Atlas configured with a database username and password

## Run locally

1. In `backend`, run `npm install`, then `npm run seed` to create the channel videos and the creator account.
2. Start the API with `npm start` in `backend`.
3. In a second terminal, run `npm install` and `npm start` in `frontend`.
4. Open `http://localhost:3000`.

To make a production frontend bundle, run `npm run build` in `frontend`; the static output is written to `frontend/build`.

For the Vercel deployment, set `REACT_APP_API_URL` to `https://noko-1.onrender.com`. The frontend adds the `/api` prefix automatically. Configure the Render service's `CLIENT_ORIGIN` as `https://nokomashaba.vercel.app` so the API accepts requests from the deployed site.

The backend authenticates to MongoDB Atlas with the database username and password configured in `backend/.env`. The local creator dashboard account is configured in `backend/.env` as `noko@gmail.com` with password `admin`; `npm run seed` creates or updates it in MongoDB. This intentionally weak password is for local testing only—change it before exposing or deploying the app, and use a deployment-specific `JWT_SECRET`. Viewer registration is available in the app. Both `.env` files are excluded from version control.

Users must sign in before liking, commenting, or sharing videos or the channel. The app removes crown icons throughout the UI.

## Structure

- `frontend/src/models` contains API access and channel data.
- `frontend/src/controllers` contains the app's data and interaction controller.
- `frontend/src/views` contains the React UI.
- `backend/src/models`, `controllers`, and `routes` implement the Express MVC API.

The database stores users (including profile avatars), videos, view counts, likes, comments (including creator replies), and recipient-specific notifications. The creator receives video likes and comments; viewers receive replies to their comments. Unread notifications show a red badge and are marked read when the notification menu is opened. The channel is organized around Comedy and Anime content, and YouTube videos are embedded from the supplied `videos.txt`.

Signed-in viewers can update their display name and select an avatar from the profile menu. A video's view count increases when its player is opened and is shown on its card and in the creator dashboard.

The creator dashboard includes an account security form for changing the creator password. It verifies the current password and requires a new password between 8 and 72 characters.
