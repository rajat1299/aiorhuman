# AI or Human Game

A real-time multiplayer game where players try to determine if they're chatting with a human or AI.

## Features

- Real-time chat using Socket.IO
- AI opponents powered by GPT-4
- Player matchmaking system
- Authentication & user profiles
- Leaderboard system
- Responsive design with Tailwind CSS

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, Socket.IO
- **Database**: MongoDB
- **AI**: OpenAI GPT-4

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
## Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/rajat1299/aiorhuman.git
   cd aiorhuman
   ```

2. Install dependencies:
   ```bash
   # Install server dependencies
   cd human-ai-game/server
   npm install

   # Install client dependencies
   cd ../../client
   npm install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env` in both client and server directories
   - Update the values in both `.env` files

4. Start MongoDB:
   ```bash
   mongod --config human-ai-game/server/config/mongod.conf
   ```
   5. Start the development servers:
   ```bash
   # Start server (in human-ai-game/server directory)
   npm run dev

   # Start client (in client directory)
   npm start
   ```

## Environment Variables

### Server
- `PORT`: Server port (default: 5001)
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Secret for JWT authentication
- `OPENAI_API_KEY`: Your OpenAI API key

### Client
- `REACT_APP_API_URL`: Backend API URL
- `REACT_APP_SOCKET_URL`: WebSocket server URL

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.