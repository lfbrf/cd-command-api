const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

app.use(bodyParser.json());

let cwd = '/';  // initial current working directory
const homeDirectory = '';  // Define the home directory
let history = [];  // To keep track of all commands and resulting directories
app.post('/api/cd', (req, res) => {
    const command = req.body.command.trim();  // Trim whitespace from command
    let newPath;

    if (command === 'cd' || command === 'cd ') {
        // Change to home directory
        newPath = homeDirectory;
    } else if (command.startsWith('cd ')) {
        const path = command.slice(3).trim();

        if (path.startsWith('/')) {
            // Absolute path
            newPath = path;
        } else {
            // Relative path
            newPath = `${cwd}/${path}`.replace(/\/{2,}/g, '/');
        }

        // Normalize newPath to handle ../ and ./
        const parts = newPath.split('/');
        const newParts = [];

        for (const part of parts) {
            if (part === '..') {
                // Move up one directory
                newParts.pop();
            } else if (part === '.' || part === '') {
                // Skip current directory indicators
                continue;
            } else {
                newParts.push(part);
            }
        }

        newPath = `/${newParts.join('/') || ''}`;
    } else {
        return res.status(400).json({ error: 'Invalid command' });
    }

    cwd = newPath;

    // Store the command and resulting cwd in history
    history.push({ command, cwd });

    res.json({ cwd });
});

app.get('/api/history', (req, res) => {
    res.json(history);
});

const server = app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

module.exports = { app, resetHistory: () => { history = []; cwd = '/' }, stopServer: () => {
    if (server) {
      server.close();
    }
  } };