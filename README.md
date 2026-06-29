# Real-Time Chat Application 

A fast, modern, and beautiful real-time chat application built with a full-stack JavaScript environment. It features secure user authentication, instant messaging, a global chat room, and a responsive glassmorphic UI.

##  Technologies Used
* **Frontend:** HTML5,  JavaScript, CSS 
* **Backend:** Node.js, Express.js
* **Real-time Engine:** Socket.io
* **Database:** MongoDB (with Mongoose)
* **Security:** bcryptjs (Password Hashing), express-session

##  Features
* **Secure Authentication:** Register and Login systems with hashed passwords.
* **Instant Real-Time Chat:** Messages appear instantly across all connected clients without refreshing.
* **Online Users List:** See exactly who is currently connected in the sidebar.
* **Typing Indicators:** See when someone is currently typing a message.
* **Message History:** Automatically fetches the last 50 messages from the database upon joining.
* **Beautiful UI:** A dark-mode, gradient-heavy, modern interface with smooth animations.

---

##  How to Run Locally on Your Computer

Follow these steps to run the code on your own machine.

### Prerequisites
You need to have the following installed on your computer:
1. **Node.js** (Download from [nodejs.org](https://nodejs.org/))
2. **MongoDB** (Download from [mongodb.com](https://www.mongodb.com/try/download/community) or use a free cloud database like MongoDB Atlas)

### 1. Clone the repository
```bash
git clone https://github.com/YourUsername/your-repo-name.git
cd your-repo-name
```
*(Skip this step if you already have the files downloaded)

### 2. Install Dependencies
This project requires several Node.js packages to run (Express, Socket.io, Mongoose, etc.). Install them by running:
```bash
npm install
```
*(Note: This creates the `node_modules` folder, which is required to run the code but ignored by Git!)*

### 3. Setup Environment Variables
Create a file named `.env` in the root folder of the project, and add the following lines to it:
```env
MONGO_URI=mongodb://localhost:27017/chatapp
SESSION_SECRET=supersecretkey123
PORT=3000
```
*(If you are using MongoDB Atlas instead of local MongoDB, replace the `MONGO_URI` with your Atlas connection string).*

### 4. Start the Application
Make sure your MongoDB server is running in the background. Then, start the Node.js server:
```bash
npm start
```

### 5. Test it out!
Open your web browser and go to: **http://localhost:3000**

Open the same link in an Incognito window or a different browser to register a second user and test the real-time chatting!

---

##  Deployment
To deploy this application to the internet 24/7 (so anyone can access it):
1. Create a free **MongoDB Atlas** database cluster.
2. Push this repository to **GitHub**.
3. Create an account on a Node.js hosting platform like **Render.com** or **Railway.app**.
4. Connect your GitHub repository to the hosting platform.
5. In the hosting platform's settings, add the Environment Variables from your `.env` file (Make sure `MONGO_URI` is set to your new Atlas link).
6. Deploy.
