const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    history: [{ command: String, cwd: String }],
    cwd: String,
    prevCwd: String // to track the previous directory
});

const User = mongoose.model('User', UserSchema);

module.exports = User;
