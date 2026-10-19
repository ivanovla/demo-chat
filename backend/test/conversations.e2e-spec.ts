import { bearer, createTestApp, registerUser, TestContext, TestUser } from './helpers';

describe('Conversations & messages', () => {
  let ctx: TestContext;
  let a: TestUser;
  let b: TestUser;
  let c: TestUser;

  beforeAll(async () => {
    ctx = await createTestApp();
    a = await registerUser(ctx);
    b = await registerUser(ctx);
    c = await registerUser(ctx);
  });

  afterAll(() => ctx.close());

  const open = async (from: TestUser, to: TestUser) =>
    (
      await ctx.http
        .post('/api/conversations')
        .set(bearer(from))
        .send({ userId: to.user.id })
        .expect(201)
    ).body;

  const send = async (from: TestUser, convId: string, text: string) =>
    (
      await ctx.http
        .post(`/api/conversations/${convId}/messages`)
        .set(bearer(from))
        .send({ text })
        .expect(201)
    ).body;

  it('creates a conversation once per pair', async () => {
    const first = await open(a, b);
    const again = await open(b, a);
    expect(again.id).toBe(first.id);
    expect(first).toMatchObject({
      peer: { id: b.user.id, username: b.user.username, online: false },
      lastMessage: null,
      unreadCount: 0,
    });
    expect(again.peer.id).toBe(a.user.id);
  });

  it('rejects a conversation with yourself or an unknown user', async () => {
    await ctx.http
      .post('/api/conversations')
      .set(bearer(a))
      .send({ userId: a.user.id })
      .expect(400);
    await ctx.http
      .post('/api/conversations')
      .set(bearer(a))
      .send({ userId: '64b000000000000000000000' })
      .expect(404);
    await ctx.http.post('/api/conversations').set(bearer(a)).send({ userId: 'nope' }).expect(400);
  });

  it('sends messages and tracks unread counts', async () => {
    const conv = await open(a, b);
    const m1 = await send(a, conv.id, '  Hello there  ');
    expect(m1).toMatchObject({ conversationId: conv.id, senderId: a.user.id, text: 'Hello there' });
    expect(m1.createdAt).toEqual(expect.any(String));
    await send(a, conv.id, 'Second');

    const forB = (await ctx.http.get('/api/conversations').set(bearer(b)).expect(200)).body;
    const item = forB.find((x: { id: string }) => x.id === conv.id);
    expect(item.unreadCount).toBe(2);
    expect(item.lastMessage.text).toBe('Second');

    await ctx.http.post(`/api/conversations/${conv.id}/read`).set(bearer(b)).expect(204);
    const after = (await ctx.http.get('/api/conversations').set(bearer(b)).expect(200)).body;
    expect(after.find((x: { id: string }) => x.id === conv.id).unreadCount).toBe(0);

    const forA = (await ctx.http.get('/api/conversations').set(bearer(a)).expect(200)).body;
    expect(forA.find((x: { id: string }) => x.id === conv.id).unreadCount).toBe(0);
  });

  it('orders conversations by latest activity', async () => {
    const ab = await open(a, b);
    const ac = await open(a, c);
    await send(c, ac.id, 'ping');
    let list = (await ctx.http.get('/api/conversations').set(bearer(a)).expect(200)).body;
    expect(list.map((x: { id: string }) => x.id)).toEqual([ac.id, ab.id]);
    await send(b, ab.id, 'pong');
    list = (await ctx.http.get('/api/conversations').set(bearer(a)).expect(200)).body;
    expect(list.map((x: { id: string }) => x.id)).toEqual([ab.id, ac.id]);
  });

  it('validates message text', async () => {
    const conv = await open(a, b);
    await ctx.http
      .post(`/api/conversations/${conv.id}/messages`)
      .set(bearer(a))
      .send({ text: '   ' })
      .expect(400);
    await ctx.http
      .post(`/api/conversations/${conv.id}/messages`)
      .set(bearer(a))
      .send({ text: 'x'.repeat(4001) })
      .expect(400);
  });

  it('forbids outsiders', async () => {
    const conv = await open(a, b);
    await ctx.http.get(`/api/conversations/${conv.id}/messages`).set(bearer(c)).expect(403);
    await ctx.http
      .post(`/api/conversations/${conv.id}/messages`)
      .set(bearer(c))
      .send({ text: 'hi' })
      .expect(403);
    await ctx.http
      .get('/api/conversations/64b000000000000000000000/messages')
      .set(bearer(a))
      .expect(404);
  });

  it('paginates messages oldest-first with a cursor', async () => {
    const d = await registerUser(ctx);
    const conv = await open(a, d);
    for (let i = 1; i <= 5; i++) await send(i % 2 ? a : d, conv.id, `m${i}`);

    const page1 = (
      await ctx.http
        .get(`/api/conversations/${conv.id}/messages?limit=2`)
        .set(bearer(a))
        .expect(200)
    ).body;
    expect(page1.items.map((m: { text: string }) => m.text)).toEqual(['m4', 'm5']);
    expect(page1.hasMore).toBe(true);

    const page2 = (
      await ctx.http
        .get(`/api/conversations/${conv.id}/messages?limit=10&before=${page1.items[0].id}`)
        .set(bearer(a))
        .expect(200)
    ).body;
    expect(page2.items.map((m: { text: string }) => m.text)).toEqual(['m1', 'm2', 'm3']);
    expect(page2.hasMore).toBe(false);
  });
});
