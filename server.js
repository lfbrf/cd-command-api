const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());

mongoose.connect('mongodb://localhost:27017/your_database', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// User model
const User = mongoose.model('User', new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    history: [{ command: String, cwd: String }],
    cwd: String,
    prevCwd: String // to track the previous directory
}));

// JWT secret key (replace with a strong secret in production)
const JWT_SECRET = 'your_jwt_secret_key';

// Middleware to authenticate JWT token
function verifyToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    jwt.verify(token, JWT_SECRET, async (err, decoded) => {
        if (err) {
            console.error('JWT verification error:', err);
            return res.status(403).json({ error: 'Forbidden: Failed to authenticate token' });
        }

        try {
            const user = await User.findOne({ username: decoded.username });

            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            req.user = user; // Attach user to request object
            next();
        } catch (err) {
            console.error('Failed to find user:', err);
            res.status(500).json({ error: 'Failed to authenticate user' });
        }
    });
}

// Function to handle changing directories with improved error handling
function changeDirectory(currentDirectory, command, user) {
    if (command === 'cd' || command === 'cd ') {
        // Change to home directory
        return '/';
    } else if (command === 'cd -') {
        // Change to the previous directory
        return user.prevCwd || currentDirectory;
    } else if (command.startsWith('cd ~')) {
        let username = command.slice(4).trim();
        if (username === '') {
            // Change to current user's home directory
            return '/';
        } else if (user && username === user.username) {
            // Change to specified user's home directory
            return `/`;
        } else {
            throw new Error('No such file or directory');
        }
    } else if (command.startsWith('cd ')) {
        let path = command.slice(3).trim();

        if (path === '.') {
            // Stay in the current directory
            return currentDirectory;
        }

        if (path.startsWith('/')) {
            // Absolute path
            return normalizePath(path);
        } else if (path === '..') {
            // Move up one directory
            if (currentDirectory !== '/') {
                return currentDirectory.substring(0, currentDirectory.lastIndexOf('/')) || '/';
            } else {
                return '/';
            }
        } else if (path.startsWith('../')) {
            // Handle ../ in relative path
            path = normalizePath(currentDirectory + '/' + path);
            return path;
        } else {
            // Relative path
            path = normalizePath(currentDirectory + '/' + path);
            return path;
        }
    } else {
        throw new Error('Invalid command format: Command must start with "cd "');
    }
}

function normalizePath(path) {
    const parts = path.split('/');
    const normalizedParts = [];
    for (const part of parts) {
        if (part === '' || part === '.') {
            continue;
        } else if (part === '..') {
            normalizedParts.pop();
        } else {
            normalizedParts.push(part);
        }
    }
    return '/' + normalizedParts.join('/');
}

app.get('/api/ls', verifyToken, async (req, res) => {
    const { options } = req.query;

    const lsCommandRegex = /^ls(\s-[a-zA-Z]+)?$/;
    // Validate ls command format
    if (options && !lsCommandRegex.test(`ls ${options || ''}`)) {
      return res.status(400).json({ error: 'No such file or directory' });
    }
    const user = req.user;
    // Handle ls command based on options (this is just an example)
    res.json({ ls: user.cwd });
  });
  

// CD command route with validation and error handling
app.post('/api/cd', verifyToken, async (req, res) => {
    const { command } = req.body;
    const user = req.user;

    try {
        // Validate and change directory
        const newCwd = changeDirectory(user.cwd, command, user);
        user.prevCwd = user.cwd; // Save the current directory as previous
        user.cwd = newCwd;
        user.history.push({ command, cwd: user.cwd });
        await user.save();
        res.json({ cwd: user.cwd });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.get('/api/cd', verifyToken, (req, res) => {
    const user = req.user;
    res.json({ cwd: user.cwd });
});

// Get history route for v2
app.get('/api/history', verifyToken, (req, res) => {
    const user = req.user;
    res.json(user.history);
});

// Login route to authenticate users and generate JWT token
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ error: 'Unauthorized: User not found' });
        }

        if (bcrypt.compareSync(password, user.password)) {
            const token = jwt.sign({ username: user.username }, JWT_SECRET, { expiresIn: '1h' });
            res.status(200).json({ message: 'Login successful', token });
        } else {
            res.status(401).json({ error: 'Unauthorized: Invalid password' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Failed to login user' });
    }
});

// Register route to create a new user
app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;

    try {
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        const hashedPassword = bcrypt.hashSync(password, 10);
        const newUser = new User({ username, password: hashedPassword, history: [], cwd: '/', prevCwd: '/' });
        await newUser.save();

        res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to register user' });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
});

// Start the server if running as main module
if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    const server = app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });

    module.exports = { app, changeDirectory, verifyToken, server };
} else {
    // Export components for testing purposes
    module.exports = { app, changeDirectory, verifyToken };
}
