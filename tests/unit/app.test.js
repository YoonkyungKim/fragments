const request = require('supertest');

const app = require('../../src/app');

describe('404 error handler', () => {
  test('should get HTTP 404 error if requesting unknown route', () =>
    request(app).get('/not-exist-route').expect(404));

  // above is cleaner way of below
  // test('should get HTTP 404 error if requesting unknown route', async () => {
  //     const res = await request(app).get('/not-exist-route');
  //     expect(res.statusCode).toBe(404);
  // });
});