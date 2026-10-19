import { io, Socket } from 'socket.io-client';
import { bearer, createTestApp, registerUser, TestContext, TestUser } from './helpers';

describe('Chat gateway', () => {
  let ctx: TestContext;
  let a: TestUser;
  let b: TestUser;
  const sockets: Socket[] = [];

  const connect = (u?: TestUser) =>
    new Promise<Socket>((resolve, reject) => {
      const s = io(ctx.url, {
        auth: u ? { token: u.token } : {},
        transports: ['websocket'],
        reconnection: false,
      });
      sockets.push(s);
      s.on('connect', () => resolve(s));
      s.on('connect_error', reject);
    });

  const once = <T>(s: Socket, event: string, match: (payload: T) => boolean = () => true) =>
    new Promise<T>((resolve) => {
      const handler = (payload: T) => {
        if (!match(payload)) return;
        s.off(event, handler);
        resolve(payload);
      };
      s.on(event, handler);
    });

  type Presence = { userId: string; online: boolean };
  const presenceOf = (u: TestUser, online: boolean) => (p: Presence) =>
    p.userId === u.user.id && p.online === online;

  beforeAll(async () => {
    ctx = await createTestApp();
    a = await registerUser(ctx);
    b = await registerUser(ctx);
  });

  afterEach(() => {
    sockets.splice(0).forEach((s) => s.disconnect());
  });

  afterAll(() => ctx.close());

  it('rejects connections without a valid token', async () => {
    await expect(connect()).rejects.toThrow('Unauthorized');
  });

  it('delivers messages to the recipient in real time', async () => {
    const conv = (
      await ctx.http
        .post('/api/conversations')
        .set(bearer(a))
        .send({ userId: b.user.id })
        .expect(201)
    ).body;
    const sa = await connect(a);
    const sb = await connect(b);

    const incoming = once<{
      message: { text: string };
      conversation: { peer: { id: string }; unreadCount: number };
    }>(sb, 'message:new');
    const ack = await sa.emitWithAck('message:send', {
      conversationId: conv.id,
      text: 'hey',
      clientId: 'c-1',
    });

    expect(ack).toMatchObject({
      ok: true,
      message: { text: 'hey', clientId: 'c-1', senderId: a.user.id },
    });
    const event = await incoming;
    expect(event.message.text).toBe('hey');
    expect(event.conversation.peer.id).toBe(a.user.id);
    expect(event.conversation.unreadCount).toBe(1);
  });

  it('acks validation and access errors', async () => {
    const sa = await connect(a);
    const bad = await sa.emitWithAck('message:send', { conversationId: 'nope', text: '' });
    expect(bad.ok).toBe(false);
    expect(bad.error).toEqual(expect.any(String));

    const missing = await sa.emitWithAck('message:send', {
      conversationId: '64b000000000000000000000',
      text: 'hi',
    });
    expect(missing).toEqual({ ok: false, error: 'Conversation not found' });
  });

  it('keeps outsiders out of other conversations', async () => {
    const c = await registerUser(ctx);
    const conv = (
      await ctx.http
        .post('/api/conversations')
        .set(bearer(a))
        .send({ userId: b.user.id })
        .expect(201)
    ).body;
    const sc = await connect(c);
    let leaked = false;
    sc.on('message:new', () => (leaked = true));

    const denied = await sc.emitWithAck('message:send', { conversationId: conv.id, text: 'hi' });
    expect(denied).toEqual({ ok: false, error: 'You are not a participant of this conversation' });

    const sa = await connect(a);
    await sa.emitWithAck('message:send', { conversationId: conv.id, text: 'private' });
    await new Promise((r) => setTimeout(r, 100));
    expect(leaked).toBe(false);
  });

  it('treats a repeated clientId as the same message', async () => {
    const conv = (
      await ctx.http
        .post('/api/conversations')
        .set(bearer(a))
        .send({ userId: b.user.id })
        .expect(201)
    ).body;
    const sa = await connect(a);
    const payload = { conversationId: conv.id, text: 'once', clientId: `retry-${Date.now()}` };
    const first = await sa.emitWithAck('message:send', payload);
    const second = await sa.emitWithAck('message:send', payload);
    expect(second.message.id).toBe(first.message.id);

    const page = (
      await ctx.http.get(`/api/conversations/${conv.id}/messages`).set(bearer(b)).expect(200)
    ).body;
    expect(
      page.items.filter((m: { clientId?: string }) => m.clientId === payload.clientId),
    ).toHaveLength(1);
    const list = (await ctx.http.get('/api/conversations').set(bearer(b)).expect(200)).body;
    const before = list.find((x: { id: string }) => x.id === conv.id).unreadCount;
    await sa.emitWithAck('message:send', payload);
    const after = (await ctx.http.get('/api/conversations').set(bearer(b)).expect(200)).body;
    expect(after.find((x: { id: string }) => x.id === conv.id).unreadCount).toBe(before);
  });

  it('marks a conversation read over the socket', async () => {
    const conv = (
      await ctx.http
        .post('/api/conversations')
        .set(bearer(a))
        .send({ userId: b.user.id })
        .expect(201)
    ).body;
    await ctx.http
      .post(`/api/conversations/${conv.id}/messages`)
      .set(bearer(a))
      .send({ text: 'x' })
      .expect(201);
    const sb = await connect(b);
    const ack = await sb.emitWithAck('conversation:read', { conversationId: conv.id });
    expect(ack).toEqual({ ok: true });
    const list = (await ctx.http.get('/api/conversations').set(bearer(b)).expect(200)).body;
    expect(list.find((x: { id: string }) => x.id === conv.id).unreadCount).toBe(0);
  });

  it('broadcasts presence and reports online users', async () => {
    const sb = await connect(b);
    const online = once<Presence>(sb, 'presence', presenceOf(a, true));
    const sa = await connect(a);
    expect(await online).toEqual({ userId: a.user.id, online: true });

    const users = (await ctx.http.get('/api/users').set(bearer(b)).expect(200)).body;
    expect(users.find((u: { id: string }) => u.id === a.user.id).online).toBe(true);

    const offline = once<Presence>(sb, 'presence', presenceOf(a, false));
    sa.disconnect();
    expect(await offline).toEqual({ userId: a.user.id, online: false });
  });
});
