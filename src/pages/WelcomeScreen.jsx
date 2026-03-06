import { useState } from 'react';
import { saveUser } from '../utils/storage';

export default function WelcomeScreen({ onDone }) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const submit = (event) => {
    event.preventDefault();
    if (name.trim().length < 2) {
      setError('Name must be at least 2 characters.');
      return;
    }
    const payload = { name: name.trim(), createdAt: new Date().toISOString() };
    saveUser(payload);
    onDone(payload);
  };

  return (
    <main className="stack page-anim-enter" style={{ paddingTop: 22 }}>
      <section className="card" style={{ minHeight: '82vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <h1 className="brand brand-wordmark">
          Trade<span className="accent">Ease</span>
        </h1>
        <p className="kicker">Welcome! What should we call you?</p>

        <form className="stack" style={{ marginTop: 24 }} onSubmit={submit}>
          <div className="field">
            <label className="field-label" htmlFor="name">Your name</label>
            <input
              id="name"
              className="field-input"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setError('');
              }}
              placeholder="e.g. Chukwuemeka"
            />
            <small className="muted">Your name helps personalise your receipts and reports.</small>
            {error ? <small className="error">{error}</small> : null}
          </div>
          <button className="btn btn-primary" type="submit">Get Started →</button>
        </form>
      </section>
    </main>
  );
}
