const { changeDirectory } = require('./index'); // Assuming changeDirectory is exported from server.js
const mongoose = require('mongoose');

// Connect to MongoDB before running tests
beforeAll(async () => {
    await mongoose.connect('mongodb://localhost:27017/your_database', {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });
});

// Disconnect from MongoDB after tests
afterAll(async () => {
    await mongoose.disconnect();
});

describe('changeDirectory function', () => {
    test('Change directory from root to /foo', () => {
        const initialDirectory = '/';
        const command = 'cd foo';
        const newDirectory = changeDirectory(initialDirectory, command);
        expect(newDirectory).toBe('/foo');
    });

    test('Change directory to initial directory', () => {
        const initialDirectory = '/current';
        const command = 'cd /current';
        const newDirectory = changeDirectory(initialDirectory, command);
        expect(newDirectory).toBe('/current');
    });

    test('Move up one directory', () => {
        const initialDirectory = '/p/q/r';
        const command = 'cd ..';
        const newDirectory = changeDirectory(initialDirectory, command);
        expect(newDirectory).toBe('/p/q');
    });

    test('Move up two directory levels', () => {
        const initialDirectory = '/p/q/r';
        const command = 'cd ../..';
        const newDirectory = changeDirectory(initialDirectory, command);
        expect(newDirectory).toBe('/p');
    });

    test('Handle ../ in relative path', () => {
        const initialDirectory = '/p/q/r';
        const command = 'cd ../../x';
        const newDirectory = changeDirectory(initialDirectory, command);
        expect(newDirectory).toBe('/p/x');
    });

    test('Change to home directory', () => {
        const initialDirectory = '/current';
        const command = 'cd';
        const newDirectory = changeDirectory(initialDirectory, command);
        expect(newDirectory).toBe('/');
    });

    test('Change to home directory with tilde', () => {
        const initialDirectory = '/current';
        const command = 'cd ~';
        const newDirectory = changeDirectory(initialDirectory, command);
        expect(newDirectory).toBe('/');
    });

    test('Change to specified user\'s home directory', () => {
        const initialDirectory = '/current';
        const command = 'cd ~john';
        const newDirectory = changeDirectory(initialDirectory, command, { username: 'john' });
        expect(newDirectory).toBe('/');
    });

    test('Throw error when change to invalid username', () => {
        const initialDirectory = '/current';
        const command = 'cd ~john';
        expect(() => changeDirectory(initialDirectory, command, { username: 'felipe' })).toThrow('No such file or directory');
    });

    test('Change to the root directory', () => {
        const initialDirectory = '/current';
        const command = 'cd /';
        const newDirectory = changeDirectory(initialDirectory, command);
        expect(newDirectory).toBe('/');
    });

    test('Change to previous directory', () => {
        const initialDirectory = '/p/q/r';
        const command = 'cd -';
        const user = { prevCwd: '/previous' };
        const newDirectory = changeDirectory(initialDirectory, command, user);
        expect(newDirectory).toBe('/previous');
    });

    test('Handle absolute path', () => {
        const initialDirectory = '/current';
        const command = 'cd /new';
        const newDirectory = changeDirectory(initialDirectory, command);
        expect(newDirectory).toBe('/new');
    });

    test('Normalize directory path removing unnecessary "."', () => {
        const initialDirectory = '/p';
        const command = 'cd ./q';
        const newDirectory = changeDirectory(initialDirectory, command);
        expect(newDirectory).toBe('/p/q');
    });

    test('Normalize directory path handling "/p/./q"', () => {
        const initialDirectory = '/';
        const command = 'cd /p/./q';
        const newDirectory = changeDirectory(initialDirectory, command);
        expect(newDirectory).toBe('/p/q');
    });

    test('Normalize directory path handling "/p/q/./r"', () => {
        const initialDirectory = '/';
        const command = 'cd /p/q/./r';
        const newDirectory = changeDirectory(initialDirectory, command);
        expect(newDirectory).toBe('/p/q/r');
    });

    test('Normalize directory path handling multiple consecutive slashes', () => {
        const initialDirectory = '/';
        const command = 'cd /p//q';
        const newDirectory = changeDirectory(initialDirectory, command);
        expect(newDirectory).toBe('/p/q');
    });

    test('Normalize directory path handling leading and trailing slashes', () => {
        const initialDirectory = '/';
        const command = 'cd /p/q/';
        const newDirectory = changeDirectory(initialDirectory, command);
        expect(newDirectory).toBe('/p/q');
    });

    test('Handle invalid command', () => {
        const initialDirectory = '/';
        const command = 'invalid-command';
        expect(() => changeDirectory(initialDirectory, command)).toThrow('Invalid command format: Command must start with "cd "');
    });

    test('Handle invalid path starting with //', () => {
        const initialDirectory = '/';
        const command = 'cd //p/q';
        const newDirectory = changeDirectory(initialDirectory, command);
        expect(newDirectory).toBe('/p/q');
    });

    test('Handle invalid path with trailing slashes', () => {
        const initialDirectory = '/';
        const command = 'cd /p/q//';
        const newDirectory = changeDirectory(initialDirectory, command);
        expect(newDirectory).toBe('/p/q');
    });

    test('Change to root directory from another directory', () => {
        const initialDirectory = '/test';
        const command = 'cd';
        const newDirectory = changeDirectory(initialDirectory, command);
        expect(newDirectory).toBe('/');
    });

    test('Navigate up from root directory remains at root', () => {
        const initialDirectory = '/';
        const command = 'cd ..';
        const newDirectory = changeDirectory(initialDirectory, command);
        expect(newDirectory).toBe('/');
    });

    test('Handle empty initial directory gracefully', () => {
        const initialDirectory = '';
        const command = 'cd test';
        const newDirectory = changeDirectory(initialDirectory, command);
        expect(newDirectory).toBe('/test');
    });

    test('Handle command that does not change directory', () => {
        const initialDirectory = '/test';
        const command = 'cd .';
        const newDirectory = changeDirectory(initialDirectory, command);
        expect(newDirectory).toBe('/test');
    });

    test('Throw error when attempting to access non-matching user\'s home directory', () => {
        const initialDirectory = '/current';
        const command = 'cd ~john';
        expect(() => changeDirectory(initialDirectory, command, { username: 'alex' })).toThrow('No such file or directory');
    });

    test('Throw error for invalid command format with extra spaces', () => {
        const initialDirectory = '/';
        const command = ' cd invalid ';
        expect(() => changeDirectory(initialDirectory, command)).toThrow('Invalid command format: Command must start with "cd "');
    });

    test('Handle normalized directory path with multiple ./ in path', () => {
        const initialDirectory = '/';
        const command = 'cd /p/././q';
        const newDirectory = changeDirectory(initialDirectory, command);
        expect(newDirectory).toBe('/p/q');
    });

    test('Handle normalized directory path with .. in the middle of the path', () => {
        const initialDirectory = '/p/q/r';
        const command = 'cd .././s/../t';
        const newDirectory = changeDirectory(initialDirectory, command);
        expect(newDirectory).toBe('/p/q/t');
    });

    test('Handle normalized directory path with trailing slash in relative path', () => {
        const initialDirectory = '/p/q';
        const command = 'cd ./r/';
        const newDirectory = changeDirectory(initialDirectory, command);
        expect(newDirectory).toBe('/p/q/r');
    });
});
