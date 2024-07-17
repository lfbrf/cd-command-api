const { app, changeDirectory } = require('./server');
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
        expect(() => changeDirectory(initialDirectory, command)).toThrow('Invalid command');
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
});
