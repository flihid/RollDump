export default function SecuritySettings() {
  return (
    <div className="card p-6 space-y-3">
      <h3 className="font-bold">Security</h3>
      <p className="text-sm text-ink-100">TOTP-based 2FA is coming in a future release. For now, use a strong password and review your active sessions regularly.</p>
      <ul className="text-sm list-disc pl-5 text-ink-100 space-y-1">
        <li>Passwords are stored using PBKDF2 with 100,000 iterations.</li>
        <li>Refresh tokens are stored hashed and can be revoked per session.</li>
        <li>Updating your password revokes all active sessions.</li>
      </ul>
    </div>
  );
}
