const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

app.use(bodyParser.json());

let cwd = '/';  // Initial current working directory
const homeDirectory = '';  // Define the home directory
const history = [];  // To keep track of all commands and resulting directories

app.post('/api/cd', (req, res) => {
    const command = req.body.command.trim();  // Trim whitespace from command
    if (command === 'cd' || command === 'cd ') {
        // Change to home directory
        cwd = homeDirectory;
    } else if (command.startsWith('cd ')) {
        const path = command.slice(3).trim();
        if (path.startsWith('/')) {
            // Absolute path
            cwd = path;
        } else if (path === '..') {
            // Move up one directory
            if (cwd !== '/') {
                cwd = cwd.substring(0, cwd.lastIndexOf('/')) || '/';
            }
        } else if (path.startsWith('../')) {
            // Handle ../ in relative path
            const parts = path.split('/');
            parts.forEach(part => {
                if (part === '..') {
                    cwd = cwd.substring(0, cwd.lastIndexOf('/')) || '/';
                } else if (part !== '.' && part !== '') {
                    cwd = `${cwd}/${part}`.replace('//', '/');
                }
            });
        } else {
            // Relative path
            cwd = `${cwd}/${path}`.replace('//', '/');
        }
    } else {
        return res.status(400).json({ error: 'Invalid command' });
    }

    // Store the command and resulting cwd in history
    history.push({ command, cwd });

    res.json({ cwd });
});

app.get('/api/history', (req, res) => {
    res.json(history);
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
