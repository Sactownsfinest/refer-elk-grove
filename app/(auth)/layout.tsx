export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-secondary flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo splash */}
        <div className="text-center mb-8">
          <img
            src="/logo.png"
            alt="Refer Elk Grove"
            className="logo-splash mx-auto drop-shadow-2xl"
            style={{ height: 320, width: 'auto', filter: 'brightness(0) invert(1)' }}
          />
          <p className="text-white/70 text-sm mt-3 tracking-wide">Business Referral Network</p>
        </div>
        {children}
      </div>
    </div>
  )
}
