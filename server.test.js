const request = require('supertest');
const { app, resetHistory, stopServer } = require('./server'); // Import the Express app from app.js

describe('POST /api/cd', () => {
    beforeEach(() => {
        // Reset initial conditions before each test
        resetHistory();
    });

    afterAll(() => {
        stopServer();
    });

    test('Change directory from root to /foo', async () => {
        const response = await request(app)
            .post('/api/cd')
            .send({ command: 'cd foo' })
            .expect(200);

        expect(response.body.cwd).toBe('/foo');
    });

    test('Change directory from /baz to /bar', async () => {
        const response = await request(app)
            .post('/api/cd')
            .send({ command: 'cd /bar' })
            .expect(200);

        expect(response.body.cwd).toBe('/bar');
    });

    test('Handle move up directory (../../../../../)', async () => {
        await request(app)
            .post('/api/cd')
            .send({ command: 'cd /foo/bar' })
            .expect(200);
        const response = await request(app)
            .post('/api/cd')
            .send({ command: 'cd ../../../../..' })
            .expect(200);

        expect(response.body.cwd).toBe('/');
    });

    test('Handle move up directory with multiple ../ and ../', async () => {
        await request(app)
            .post('/api/cd')
            .send({ command: 'cd /x/y' })
            .expect(200);
        const response = await request(app)
            .post('/api/cd')
            .send({ command: 'cd ../p/../q' })
            .expect(200);

        expect(response.body.cwd).toBe('/x/q');
    });

    test('Handle absolute path with ./ and /p/./q', async () => {
        const response = await request(app)
            .post('/api/cd')
            .send({ command: 'cd /x/y' })
            .expect(200);

        const response2 = await request(app)
            .post('/api/cd')
            .send({ command: 'cd /p/./q' })
            .expect(200);

        expect(response2.body.cwd).toBe('/p/q');
    });

    test('Change directory to initial directory', async () => {
        const response = await request(app)
            .post('/api/cd')
            .send({ command: 'cd' })
            .expect(200);

        expect(response.body.cwd).toBe('');
    });

    test('Change directory to absolute path', async () => {
        const response = await request(app)
            .post('/api/cd')
            .send({ command: 'cd /var/www' })
            .expect(200);

        expect(response.body.cwd).toBe('/var/www');
    });

    test('Change directory to relative path', async () => {
        const response = await request(app)
            .post('/api/cd')
            .send({ command: 'cd projects' })
            .expect(200);

        expect(response.body.cwd).toBe('/projects');
    });

    test('Handle complex relative path', async () => {
        await request(app)
            .post('/api/cd')
            .send({ command: 'cd /home/user' })
            .expect(200);
        const response = await request(app)
            .post('/api/cd')
            .send({ command: 'cd ./../../test' })
            .expect(200);

        expect(response.body.cwd).toBe('/test');
    });

    test('Handle invalid command', async () => {
        const response = await request(app)
            .post('/api/cd')
            .send({ command: 'invalid' })
            .expect(400);

        expect(response.body.error).toBe('Invalid command');
    });
});

describe('GET /api/history', () => {
    beforeEach(() => {
        resetHistory();
    });

    afterAll(() => {
        stopServer();
    });

    test('Fetch command history', async () => {
        await request(app).post('/api/cd').send({ command: 'cd /var/www' });
        await request(app).post('/api/cd').send({ command: 'cd projects' });

        const response = await request(app)
            .get('/api/history')
            .expect(200);

        expect(response.body.length).toBe(2);
        expect(response.body[0].command).toBe('cd /var/www');
        expect(response.body[0].cwd).toBe('/var/www');
        expect(response.body[1].command).toBe('cd projects');
        expect(response.body[1].cwd).toBe('/var/www/projects');
    });
});
