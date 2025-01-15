# Real-time Chat Application 💬

A modern real-time chat application built with Spring Boot and WebSocket for backend, and vanilla JavaScript for frontend.

## Features 🌟

- Real-time messaging using WebSocket protocol
- Public chat room for all users 👥
- Private messaging between users 📨
- User presence detection (online/offline status) 🟢
- Message history persistence 📝
- Unread message counters 🔔
- Automatic scrolling to new messages ⬇️
- Clean and responsive UI 📱

## Tech Stack 🛠️

- **Backend:**
  - Java 11
  - Spring Boot
  - WebSocket (STOMP)
  - Gradle

- **Frontend:**
  - HTML5
  - CSS3
  - Vanilla JavaScript
  - WebSocket client (SockJS)

## Getting Started 🚀

1. Clone the repository:
```sh
git clone <repository-url>
```

2. Build the project:
```sh
./gradlew build
```

3. Run the application:
```sh
./gradlew bootRun
```

4. Open browser at `http://localhost:28852`

## Usage 📋

1. Enter your username to join the chat
2. Use "Public Chat" for group messages
3. Click on any user in the sidebar for private messaging
4. Messages show sender name and timestamp
5. Unread message counter appears for new private messages

## Project Structure 📁

In the task directory:
- `src/chat/` - Backend source code
  - `controller/` - WebSocket and REST controllers
  - `model/` - Data models
  - `config/` - WebSocket configuration
- `resources/static/` - Frontend assets
  - index.html - Main page
  - index.js - Client-side logic
  - styles.css - Styling

## Contributing 🤝

Feel free to submit issues and enhancement requests!
