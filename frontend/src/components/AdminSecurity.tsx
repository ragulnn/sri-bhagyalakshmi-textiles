import React, { useEffect, useState } from 'react';

const input =
  'w-full bg-white border border-[#E5DFD5] px-3 py-2 text-sm focus:outline-none focus:border-[#c89d42]';
const btnDark =
  'px-5 py-2.5 bg-[#181512] text-white text-[11px] uppercase tracking-luxury hover:bg-[#c89d42] hover:text-[#181512] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';
const btnLight =
  'px-4 py-2 border border-[#181512] text-[#181512] text-[11px] uppercase tracking-luxury hover:bg-[#181512] hover:text-white transition-colors cursor-pointer';

export const AdminSecurity: React.FC<{
  token: string;
  onChange: (enabled: boolean) => void;
  onExpired: () => void;
}> = ({ token, onChange, onExpired }) => {
  const [status, setStatus] = useState<{ enabled: boolean; backupLeft: number } | null>(null);
  const [setup, setSetup] = useState<{ secret: string; qr: string } | null>(null);
  const [code, setCode] = useState('');
  const [backup, setBackup] = useState<string[] | null>(null);
  const [offPw, setOffPw] = useState('');
  const [offCode, setOffCode] = useState('');
  const [showOff, setShowOff] = useState(false);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const call = async (path: string, method = 'GET', body?: unknown) => {
    const res = await fetch(path, {
      method,
      headers: { Authorization: `Bearer ${token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
      body: body ? JSON.stringify(body) : undefined
    });
    if (res.status === 401 && path.endsWith('/status')) {
      onExpired();
      throw new Error('Session expired');
    }
    const j = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(j.error || 'Something went wrong.');
    return j;
  };

  const refresh = async () => {
    try {
      const j = await call('/api/admin/2fa/status');
      setStatus(j);
      onChange(j.enabled);
    } catch {}
  };

  useEffect(() => {
    refresh();
  }, []);

  const start = async () => {
    setErr('');
    setBusy(true);
    try {
      const j = await call('/api/admin/2fa/setup', 'POST');
      const QR = await import('qrcode');
      const qr = await QR.toDataURL(j.uri, { width: 220, margin: 1 });
      setSetup({ secret: j.secret, qr });
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  const enable = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      const j = await call('/api/admin/2fa/enable', 'POST', { code });
      setBackup(j.backupCodes);
      setSetup(null);
      setCode('');
      await refresh();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  const disable = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      await call('/api/admin/2fa/disable', 'POST', { password: offPw, code: offCode });
      setShowOff(false);
      setOffPw('');
      setOffCode('');
      await refresh();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  const downloadCodes = () => {
    const blob = new Blob(['Admin backup codes (each works once)\n\n' + backup!.join('\n') + '\n'], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'admin-backup-codes.txt';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  if (!status) return <p className="p-6 text-sm text-[#756F66]">Loading…</p>;

  return (
    <div className="bg-white border border-[#E5DFD5] p-6 max-w-2xl space-y-5">
      <div className="flex items-center gap-3">
        <h2 className="font-serif text-xl">2-step login</h2>
        <span
          className={`text-[10px] uppercase tracking-widest px-2 py-1 border ${
            status.enabled ? 'border-[#173629] text-[#173629]' : 'border-[#801319] text-[#801319]'
          }`}
        >
          {status.enabled ? 'On' : 'Off'}
        </span>
      </div>

      {backup && (
        <div className="border border-[#c89d42] bg-[#fdf6e3] p-4 space-y-3">
          <p className="text-sm font-semibold">Save your backup codes now. They will not be shown again.</p>
          <p className="text-xs text-[#756F66]">
            If you lose your phone, each code lets you log in once. Keep them somewhere safe and private.
          </p>
          <div className="grid grid-cols-2 gap-2 font-mono text-sm">
            {backup.map((c) => (
              <span key={c} className="bg-white border border-[#E5DFD5] px-2 py-1">
                {c}
              </span>
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={downloadCodes} className={btnLight}>
              Download
            </button>
            <button onClick={() => setBackup(null)} className={btnDark}>
              I have saved them
            </button>
          </div>
        </div>
      )}

      {!status.enabled && !setup && (
        <>
          <p className="text-sm text-[#756F66]">
            When this is on, logging in needs your password and a 6-digit code from an authenticator app on your phone
            (Google Authenticator, Microsoft Authenticator or Authy). A stolen password alone will not get anyone in.
          </p>
          <button onClick={start} disabled={busy} className={btnDark}>
            {busy ? 'Please wait…' : 'Turn on 2-step login'}
          </button>
        </>
      )}

      {setup && (
        <form onSubmit={enable} className="space-y-4">
          <ol className="text-sm list-decimal pl-5 space-y-1 text-[#756F66]">
            <li>Open your authenticator app and add a new account.</li>
            <li>Scan this QR code, or type the key below.</li>
            <li>Enter the 6-digit code the app shows.</li>
          </ol>
          <div className="flex flex-wrap items-center gap-5">
            <img src={setup.qr} alt="QR code" className="w-[220px] h-[220px] border border-[#E5DFD5]" />
            <div>
              <p className="text-[11px] uppercase tracking-widest text-[#756F66] mb-1">Setup key</p>
              <p className="font-mono text-sm break-all select-all">{setup.secret}</p>
            </div>
          </div>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={7}
            placeholder="123456"
            className={`${input} !w-40 tracking-widest text-center`}
          />
          <div className="flex gap-3">
            <button type="submit" disabled={busy || code.replace(/\s/g, '').length !== 6} className={btnDark}>
              {busy ? 'Checking…' : 'Confirm and turn on'}
            </button>
            <button type="button" onClick={() => setSetup(null)} className={btnLight}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {status.enabled && (
        <>
          <p className="text-sm text-[#756F66]">
            Backup codes left: <strong className="text-[#181512]">{status.backupLeft}</strong>
          </p>
          {!showOff ? (
            <button onClick={() => setShowOff(true)} className="text-[11px] uppercase tracking-luxury text-[#801319] cursor-pointer">
              Turn off 2-step login
            </button>
          ) : (
            <form onSubmit={disable} className="space-y-3 max-w-sm">
              <p className="text-xs text-[#756F66]">To turn it off, enter your admin password and a current code (or a backup code).</p>
              <input type="password" value={offPw} onChange={(e) => setOffPw(e.target.value)} placeholder="Admin password" className={input} />
              <input value={offCode} onChange={(e) => setOffCode(e.target.value)} placeholder="Code" autoComplete="one-time-code" className={input} />
              <div className="flex gap-3">
                <button type="submit" disabled={busy || !offPw || !offCode} className={btnDark}>
                  Turn off
                </button>
                <button type="button" onClick={() => setShowOff(false)} className={btnLight}>
                  Cancel
                </button>
              </div>
            </form>
          )}
        </>
      )}

      {err && <p className="text-sm text-[#801319]">{err}</p>}
    </div>
  );
};
