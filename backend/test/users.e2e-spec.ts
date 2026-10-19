import { bearer, createTestApp, registerUser, TestContext, TestUser } from './helpers';

describe('Users', () => {
  let ctx: TestContext;
  let me: TestUser;

  beforeAll(async () => {
    ctx = await createTestApp();
    me = await registerUser(ctx, 'jordan');
    await registerUser(ctx, 'maya_chen');
    await registerUser(ctx, 'Theo');
    await registerUser(ctx, 'dev_raj');
  });

  afterAll(() => ctx.close());

  it('lists all users except me, sorted by username', async () => {
    const res = await ctx.http.get('/api/users').set(bearer(me)).expect(200);
    const names = res.body.map((u: { username: string }) => u.username);
    expect(names).toEqual(['dev_raj', 'maya_chen', 'Theo']);
    expect(res.body[0]).toEqual({ id: expect.any(String), username: 'dev_raj', online: false });
  });

  it('searches by username case-insensitively', async () => {
    const res = await ctx.http.get('/api/users?search=THE').set(bearer(me)).expect(200);
    expect(res.body.map((u: { username: string }) => u.username)).toEqual(['Theo']);
  });

  it('treats search input as plain text', async () => {
    const res = await ctx.http.get('/api/users?search=.*').set(bearer(me)).expect(200);
    expect(res.body).toEqual([]);
  });

  it('limits results', async () => {
    const res = await ctx.http.get('/api/users?limit=2').set(bearer(me)).expect(200);
    expect(res.body).toHaveLength(2);
    await ctx.http.get('/api/users?limit=500').set(bearer(me)).expect(400);
  });

  it('requires auth', async () => {
    await ctx.http.get('/api/users').expect(401);
  });
});
