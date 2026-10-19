<script lang="ts">
  import { goto } from '$app/navigation';
  import { ApiError, errorText } from '$lib/api';
  import { login, register } from '$lib/stores/auth';
  import Icon from '../ui/Icon.svelte';

  let { mode }: { mode: 'login' | 'register' } = $props();

  type Field = 'email' | 'username' | 'password';

  let values = $state({ email: '', username: '', password: '' });
  let touched = $state<Partial<Record<Field, boolean>>>({});
  let serverErrors = $state<Partial<Record<Field, string>>>({});
  let serverError = $state('');
  let submitting = $state(false);
  let showPassword = $state(false);

  const isRegister = $derived(mode === 'register');

  function validate(v: typeof values): Partial<Record<Field, string>> {
    const e: Partial<Record<Field, string>> = {};
    const email = v.email.trim();
    if (!email) e.email = 'Enter your email';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Enter a valid email address';
    if (isRegister) {
      if (!v.username) e.username = 'Choose a username';
      else if (!/^[A-Za-z0-9_]{3,20}$/.test(v.username))
        e.username = 'Use 3–20 letters, digits or underscores';
      if (!v.password) e.password = 'Create a password';
      else if (v.password.length < 8) e.password = 'Use at least 8 characters';
    } else if (!v.password) e.password = 'Enter your password';
    return e;
  }

  const clientErrors = $derived(validate(values));
  const errorFor = (f: Field) => serverErrors[f] ?? (touched[f] ? clientErrors[f] : undefined);

  function edit(f: Field, value: string) {
    values[f] = value;
    serverErrors[f] = undefined;
    serverError = '';
  }

  async function submit(e: SubmitEvent) {
    e.preventDefault();
    touched = { email: true, username: true, password: true };
    if (Object.keys(clientErrors).length) return;

    submitting = true;
    serverError = '';
    try {
      if (isRegister) await register(values.email.trim(), values.username, values.password);
      else await login(values.email.trim(), values.password);
      await goto('/');
    } catch (err) {
      if (
        err instanceof ApiError &&
        err.field &&
        (err.field === 'email' || err.field === 'username')
      ) {
        serverErrors[err.field] = err.message;
      } else {
        serverError = errorText(err);
      }
    } finally {
      submitting = false;
    }
  }
</script>

<main class="auth">
  <div class="auth-card">
    <div class="brand">
      <svg class="brand-mark" viewBox="0 0 32 32" aria-hidden="true">
        <rect class="logo-bg" width="32" height="32" rx="10"></rect>
        <circle class="logo-dot" cx="16" cy="16" r="3.2"></circle>
        <circle class="logo-ring" cx="16" cy="16" r="8"></circle>
      </svg>
      <span class="brand-name">Demo Chat App</span>
    </div>

    <div class="auth-head">
      {#if isRegister}
        <h1 class="auth-title">Create your account</h1>
        <p class="auth-sub">Pick a username people can find you by.</p>
      {:else}
        <h1 class="auth-title">Welcome back</h1>
        <p class="auth-sub">Sign in to continue your conversations.</p>
      {/if}
    </div>

    {#if serverError}
      <div class="banner banner-error" role="alert">
        <Icon name="alert" size="sm" /><span>{serverError}</span>
      </div>
    {/if}

    <form class="auth-form" onsubmit={submit} novalidate>
      <div class="field">
        <label class="field-label" for="auth-email">Email</label>
        <input
          id="auth-email"
          class="input"
          class:is-invalid={!!errorFor('email')}
          type="email"
          autocomplete="email"
          placeholder="you@example.com"
          value={values.email}
          oninput={(e) => edit('email', e.currentTarget.value)}
          onblur={() => (touched.email = true)}
          disabled={submitting}
          aria-invalid={!!errorFor('email')}
          aria-describedby="auth-email-msg"
        />
        {#if errorFor('email')}
          <p id="auth-email-msg" class="field-error">
            <Icon name="alert" size="xs" />{errorFor('email')}
          </p>
        {/if}
      </div>

      {#if isRegister}
        <div class="field">
          <label class="field-label" for="auth-username">Username</label>
          <input
            id="auth-username"
            class="input"
            class:is-invalid={!!errorFor('username')}
            type="text"
            autocomplete="username"
            placeholder="e.g. maya_chen"
            value={values.username}
            oninput={(e) => edit('username', e.currentTarget.value)}
            onblur={() => (touched.username = true)}
            disabled={submitting}
            aria-invalid={!!errorFor('username')}
            aria-describedby="auth-username-msg"
          />
          {#if errorFor('username')}
            <p id="auth-username-msg" class="field-error">
              <Icon name="alert" size="xs" />{errorFor('username')}
            </p>
          {:else}
            <p id="auth-username-msg" class="field-hint">
              3–20 characters: letters, digits or underscore.
            </p>
          {/if}
        </div>
      {/if}

      <div class="field">
        <label class="field-label" for="auth-password">Password</label>
        <div class="input-wrap">
          <input
            id="auth-password"
            class="input"
            class:is-invalid={!!errorFor('password')}
            type={showPassword ? 'text' : 'password'}
            autocomplete={isRegister ? 'new-password' : 'current-password'}
            placeholder={isRegister ? 'At least 8 characters' : 'Your password'}
            value={values.password}
            oninput={(e) => edit('password', e.currentTarget.value)}
            onblur={() => (touched.password = true)}
            disabled={submitting}
            aria-invalid={!!errorFor('password')}
            aria-describedby="auth-password-msg"
          />
          <button
            type="button"
            class="input-icon-btn"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            onclick={() => (showPassword = !showPassword)}
            disabled={submitting}
          >
            <Icon name={showPassword ? 'eyeOff' : 'eye'} />
          </button>
        </div>
        {#if errorFor('password')}
          <p id="auth-password-msg" class="field-error">
            <Icon name="alert" size="xs" />{errorFor('password')}
          </p>
        {:else if isRegister}
          <p id="auth-password-msg" class="field-hint">At least 8 characters.</p>
        {/if}
      </div>

      <button type="submit" class="btn btn-primary btn-block btn-lg" disabled={submitting}>
        {#if submitting}<span class="spinner" aria-hidden="true"></span>{/if}
        <span>
          {#if isRegister}{submitting ? 'Creating account…' : 'Create account'}{:else}{submitting
              ? 'Signing in…'
              : 'Sign in'}{/if}
        </span>
      </button>
    </form>

    {#if isRegister}
      <p class="auth-switch">
        Already have an account? <a class="link-btn" href="/login">Sign in</a>
      </p>
    {:else}
      <p class="auth-switch">
        New to Demo Chat App? <a class="link-btn" href="/register">Create an account</a>
      </p>
    {/if}
  </div>
</main>
