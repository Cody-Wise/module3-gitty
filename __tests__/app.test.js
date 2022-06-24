const pool = require('../lib/utils/pool');
const setup = require('../data/setup');
const request = require('supertest');
const app = require('../lib/app');

jest.mock('../lib/services/github');

const Login = async (userProps = {}) => {
  // Create an "agent" that gives us the ability
  // to store cookies between requests in a test
  const agent = request.agent(app);

  // Create a user to sign in with
  await agent.get('/api/v1/github/callback?code=42').redirects(1);
  return [agent];
};

describe('Testing routes', () => {
  beforeEach(() => {
    return setup(pool);
  });
  it('should redirect to the github oauth page upon login', async () => {
    const res = await request(app).get('/api/v1/github/login');

    expect(res.header.location).toMatch(
      /https:\/\/github.com\/login\/oauth\/authorize\?client_id=[\w\d]+&scope=user&redirect_uri=http:\/\/localhost:7890\/api\/v1\/github\/callback/i
    );
  });

  it('should login and redirect users to /api/v1/github/dashboard', async () => {
    const res = await request
      .agent(app)
      .get('/api/v1/github/callback?code=42')
      .redirects(1);

    expect(res.body).toEqual({
      user: {
        id: expect.any(String),
        username: 'fake_github_user',
        email: 'not-real@example.com',
        avatar: expect.any(String),
        iat: expect.any(Number),
        exp: expect.any(Number),
      },
    });
  });
  it('Deletes session and logs out user', async () => {
    const res = await request.agent(app).delete('/api/v1/github/sessions');
    expect(res.status).toEqual(200);
  });
});
it('Posting Posts Fails Without login', async () => {
  // await request.agent(app).get('/api/v1/github/callback?code=42').redirects(1);
  const res = await request(app).post('/api/v1/posts').send({
    description: 'This is a test',
  });
  expect(res.status).toEqual(401);
});

it('Reading Posts Fails Without login', async () => {
  // await request.agent(app).get('/api/v1/github/callback?code=42').redirects(1);
  const res = await request(app).get('/api/v1/posts');
  expect(res.status).toEqual(401);
});
it('Logs in and post a post', async () => {
  const [agent] = await Login();
  // await request.agent(app).get('/api/v1/github/callback?code=42').redirects(1);
  const res = await agent.post('/api/v1/posts').send({
    description: 'This is a test',
  });
  expect(res.status).toEqual(200);
});

it('Log in and views posts', async () => {
  const [agent] = await Login();
  // await request.agent(app).get('/api/v1/github/callback?code=42').redirects(1);
  await agent.post('/api/v1/posts').send({
    description: 'This is a test',
  });
  const res = await agent.get('/api/v1/posts');
  expect(res.body[0].description).toEqual('This is a test');
});
afterAll(() => {
  pool.end();
});
