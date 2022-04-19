const request = require('supertest');
const fs = require('mz/fs');
const app = require('../../src/app');

describe('GET /v1/fragments/:id', () => {
  // If the request is missing the Authorization header, it should be forbidden
  test('unauthenticated requests are denied', () => request(app).get('/v1/fragments/randomid').expect(401));

  // If the wrong username/password pair are used (no such user), it should be forbidden
  test('incorrect credentials are denied', () =>
    request(app).get('/v1/fragments/randomid').auth('invalid@email.com', 'incorrect_password').expect(401));

  // Using a valid username/password pair should give a success result with fragment data with given id
  test('authenticated users get fragment data with the given id', async () => {
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('This is fragment');
    const id = (JSON.parse(postRes.text)).fragment.id;

    const getRes = await request(app)
      .get(`/v1/fragments/${id}`)
      .auth('user1@email.com', 'password1');

    expect(getRes.statusCode).toBe(200);
    expect(getRes.text).toEqual('This is fragment');
  });

  // No fragment with the given id
  test('no fragments with the given id returns 404 error', async () => {
    const getRes = await request(app)
      .get('/v1/fragments/randomid')
      .auth('user1@email.com', 'password1');
    expect(getRes.statusCode).toBe(404);
  });

  // If the extension used represents an unknown or unsupported type, or if the fragment cannot be converted to this type, 
  // an HTTP 415 error is returned instead, with an appropriate message. For example, a plain text fragment cannot be returned as a PNG.
  test('if fragment cannot be converted to the extension type used, returns 415 error', async () => {
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user2@email.com', 'password2')
      .set('Content-Type', 'text/plain')
      .send('This is fragment');
    const id = (JSON.parse(postRes.text)).fragment.id;

    const getRes = await request(app)
      .get(`/v1/fragments/${id}.png`)
      .auth('user2@email.com', 'password2');

    expect(getRes.statusCode).toBe(415);
  });

  // convert md to html
  test('markdown data can be converted to html, user can get converted result by specifying extension', async () => {
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user3@email.com', 'password3')
      .set('Content-Type', 'text/markdown')
      .send('# This is fragment');
    const id = (JSON.parse(postRes.text)).fragment.id;

    const getRes = await request(app)
      .get(`/v1/fragments/${id}.html`)
      .auth('user3@email.com', 'password3');

    expect(getRes.statusCode).toBe(200);
    expect(getRes.headers['content-type']).toEqual('text/html; charset=utf-8');
  });

  // convert md to plain text
  test('markdown data can be converted to plain text, user can get converted result by specifying extension', async () => {
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user2@email.com', 'password2')
      .set('Content-Type', 'text/markdown')
      .send('# This is fragment 2');
    const id = (JSON.parse(postRes.text)).fragment.id;

    const getRes = await request(app)
      .get(`/v1/fragments/${id}.txt`)
      .auth('user2@email.com', 'password2');

    console.log(getRes);
    expect(getRes.statusCode).toBe(200);
    expect(getRes.headers['content-type']).toEqual('text/plain; charset=utf-8');
  });

  
  const filePath = `${__dirname}/testFiles/dog.jpeg`;

  // get image fragment
  test('get the image fragment', async () => {
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'image/jpeg')
      .send(fs.readFileSync(filePath))
    
    expect(postRes.statusCode).toBe(201);
    
    const id = postRes.header.location.split('fragments/')[1];

    const getRes = await request(app)
      .get(`/v1/fragments/${id}`)
      .auth('user1@email.com', 'password1');

    expect(getRes.statusCode).toBe(200);
  });

  // get image fragment by converting it to other image formats
  test('get the image fragment by converting it to other image formats', async () => {
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'image/jpeg')
      .send(fs.readFileSync(filePath))
    
    expect(postRes.statusCode).toBe(201);
    
    const id = postRes.header.location.split('fragments/')[1];

    const getResPng = await request(app)
      .get(`/v1/fragments/${id}.png`)
      .auth('user1@email.com', 'password1');

    expect(getResPng.statusCode).toBe(200);

    const getResWebp = await request(app)
      .get(`/v1/fragments/${id}.webp`)
      .auth('user1@email.com', 'password1');

    expect(getResWebp.statusCode).toBe(200);
  });
});