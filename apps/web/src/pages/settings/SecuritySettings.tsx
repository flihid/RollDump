export default function SecuritySettings() {
  return (
    <div className="card p-6 space-y-3">
      <h3 className="font-bold">Keamanan</h3>
      <p className="text-sm text-ink-700">2FA berbasis TOTP akan tersedia di rilis berikutnya. Untuk saat ini, gunakan password kuat dan periksa sesi aktif Anda secara berkala.</p>
      <ul className="text-sm list-disc pl-5 text-ink-700 space-y-1">
        <li>Password disimpan menggunakan PBKDF2 100.000 iterasi.</li>
        <li>Refresh token disimpan hashed dan dapat dicabut per sesi.</li>
        <li>Pembaruan password mencabut semua sesi aktif.</li>
      </ul>
    </div>
  );
}
