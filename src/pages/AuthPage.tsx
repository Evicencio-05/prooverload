import { useState } from 'react';
import { useApp } from '../state/AppState';

export function AuthPage() {
  const { signIn, signUp, authError, configError } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'in' | 'up'>('up');
  const [busy, setBusy] = useState(false);

  return (
    <main className="screen auth">
      <p className="eyebrow">Gym logging</p>
      <h1>ProOverload</h1>
      <p className="lede">
        Log sets in seconds on your phone. Progressive overload and muscle coverage come along for
        the ride — they never get in the way of the next set.
      </p>
      {configError && <p className="banner err">{configError}</p>}
      <form
        className="stack"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            if (mode === 'in') await signIn(email, password);
            else await signUp(email, password);
          } catch {
            /* surfaced via authError */
          } finally {
            setBusy(false);
          }
        }}
      >
        <input
          type="email"
          autoComplete="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          autoComplete={mode === 'up' ? 'new-password' : 'current-password'}
          placeholder="Password (6+ characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
        />
        {authError && <p className="err">{authError}</p>}
        <button type="submit" className="primary" disabled={busy || Boolean(configError)}>
          {mode === 'in' ? 'Sign in' : 'Create account'}
        </button>
      </form>
      <button type="button" className="ghost" onClick={() => setMode(mode === 'in' ? 'up' : 'in')}>
        {mode === 'in' ? 'Need an account?' : 'Already have an account?'}
      </button>
    </main>
  );
}
