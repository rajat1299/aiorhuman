# AI or Human Game

A real-time multiplayer game where players try to determine if they're chatting with a human or AI.

## Features
- Real-time chat
- AI opponents using GPT-4
- Player matchmaking
- Leaderboard system
- User authentication

## Setup
1. Clone the repository
2. Install dependencies:
   ```bash
   # Install server dependencies
   cd server
   npm install

   # Install client dependencies
   cd ../client
   npm install
   ```

3. Set up environment variables:
Create `.env` files in both server and client directories

4. Start the development servers:
   ```bash
   # Start server
   cd server
   npm run dev

   # Start client
   cd ../client
   npm start
   ```

## Technologies Used
- Frontend: React, TypeScript, Tailwind CSS
- Backend: Node.js, Express, Socket.IO
- Database: MongoDB
