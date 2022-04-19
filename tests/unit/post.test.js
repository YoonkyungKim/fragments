const request = require('supertest');
const fs = require('mz/fs');

const app = require('../../src/app');

describe('POST /v1/fragments', () => {
  // If the request is missing the Authorization header, it should be forbidden
  test('unauthenticated requests are denied', () => request(app).post('/v1/fragments').expect(401));

  // If the wrong username/password pair are used (no such user), it should be forbidden
  test('incorrect credentials are denied', () =>
    request(app).post('/v1/fragments').auth('invalid@email.com', 'incorrect_password').expect(401));

  // User with valid username/password pair should be able to create a plain text fragment
  // responses include all necessary and expected properties (id, created, type, etc),
  // and these values match what you expect for a given request (e.g., size and type)
  test('authenticated users create a plain text fragment, response include expected properties', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('aa');
    const body = JSON.parse(res.text);
    expect(res.statusCode).toBe(201);
    expect(body.status).toBe('ok');
    expect(body.fragment.type).toMatch(/text\/plain+/);
    expect(Object.keys(body.fragment)).toEqual(['id', 'ownerId', 'created', 'updated', 'type', 'size']);
    expect(body.fragment.size).toEqual(2);
  });

  const filePath = `${__dirname}/testFiles/dog.jpeg`;

  // post image (jpeg) fragment
  test('post the image fragment', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'image/jpeg')
      .send(fs.readFileSync(filePath));

    expect(res.statusCode).toBe(201);
  });

  //responses include a Location header with a URL to GET the fragment
  test('response include a Location header with a URL to GET the fragment', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('This is fragment');
    expect(res.statusCode).toBe(201);
    expect(res.headers.location).toEqual(`${process.env.API_URL}/v1/fragments/${JSON.parse(res.text).fragment.id}`);
  });

  //trying to create a fragment with an unsupported type errors as expected
  test('get unsupported type error', () => 
    request(app)
      .post('/v1/fragments')
      .set('Content-Type', 'audio/mpeg')
      .auth('user1@email.com', 'password1')
      .send('aa')
      .expect(415)
  );
});