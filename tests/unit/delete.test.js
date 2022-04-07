const request = require('supertest');

const app = require('../../src/app');

describe('DELETE /v1/fragments', () => {
  // If the request is missing the Authorization header, it should be forbidden
  test('unauthenticated requests are denied', () => request(app).delete('/v1/fragments').expect(401));

  // If the wrong username/password pair are used (no such user), it should be forbidden
  test('incorrect credentials are denied', () =>
    request(app).delete('/v1/fragments').auth('invalid@email.com', 'incorrect_password').expect(401));

  // No fragment with the given id
  test('if no id found, returns 404 error', async () => {
    const deleted = await request(app)
      .delete(`/v1/fragments/randomid`)
      .auth('user1@email.com', 'password1');

    expect(deleted.statusCode).toBe(404);
  });

  // after deleted successfully, it returns 200, and GET returns 404 with the id
  test('successful delete with auth returns 200 and GET returns 404', async () => {
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user2@email.com', 'password2')
      .set('Content-Type', 'text/plain')
      .send('This is fragment');
    const id = (JSON.parse(postRes.text)).fragment.id;

    const deleted = await request(app)
      .delete(`/v1/fragments/${id}`)
      .auth('user2@email.com', 'password2');

    expect(deleted.statusCode).toBe(200);

    const getRes = await request(app)
      .get(`/v1/fragments/${id}`)
      .auth('user2@email.com', 'password2');

    expect(getRes.statusCode).toBe(404);

    const getAll = await request(app)
      .get(`/v1/fragments`)
      .auth('user2@email.com', 'password2');

    expect(getAll.body.fragments).toEqual([]);
  });
});