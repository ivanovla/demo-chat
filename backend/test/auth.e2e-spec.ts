import { bearer, createTestApp, registerUser, TestContext } from './helpers';

describe('Auth', () => {
  let ctx: TestContext;

  beforeAll(async () => {
    ctx = await createTestApp();
  });

  afterAll(() => ctx.close());

  it('registers a user and returns a token', async () => {
    const res = await ctx.http
      .post('/api/auth/register')
      .send({ email: 'Maya@Test.dev', username: 'maya_chen', password: 'password123' })
      .expect(201);

    expect(res.body.accessToken).toEqual(expect.any(String));
    expect(res.body.user).toMatchObject({ username: 'maya_chen', email: 'maya@test.dev' });
    expect(res.body.user.id).toEqual(expect.any(String));
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  it('rejects a taken email', async () => {
    const res = await ctx.http
      .post('/api/auth/register')
      .send({ email: 'maya@test.dev', username: 'other', password: 'password123' })
      .expect(409);
    expect(res.body).toMatchObject({ statusCode: 409, field: 'email' });
  });

  it('rejects a taken username regardless of case', async () => {
    const res = await ctx.http
      .post('/api/auth/register')
      .send({ email: 'x@test.dev', username: 'MAYA_CHEN', password: 'password123' })
      .expect(409);
    expect(res.body).toMatchObject({ statusCode: 409, field: 'username' });
  });

  it('validates the payload', async () => {
    const res = await ctx.http
      .post('/api/auth/register')
      .send({ email: 'nope', username: 'a', password: 'short', extra: true })
      .expect(400);
    expect(res.body.statusCode).toBe(400);
    expect(Array.isArray(res.body.message)).toBe(true);
  });

  it('logs in with valid credentials', async () => {
    const res = await ctx.http
      .post('/api/auth/login')
      .send({ email: 'maya@test.dev', password: 'password123' })
      .expect(200);
    expect(res.body.user.username).toBe('maya_chen');
    expect(res.body.accessToken).toEqual(expect.any(String));
  });

  it('rejects a wrong password', async () => {
    const res = await ctx.http
      .post('/api/auth/login')
      .send({ email: 'maya@test.dev', password: 'wrong-password' })
      .expect(401);
    expect(res.body.message).toBe('Invalid email or password');
  });

  it('protects private routes', async () => {
    await ctx.http.get('/api/auth/me').expect(401);
    await ctx.http.get('/api/auth/me').set({ Authorization: 'Bearer garbage' }).expect(401);
  });

  it('returns the current user', async () => {
    const u = await registerUser(ctx);
    const res = await ctx.http.get('/api/auth/me').set(bearer(u)).expect(200);
    expect(res.body).toMatchObject({
      id: u.user.id,
      username: u.user.username,
      email: u.user.email,
    });
  });
});
