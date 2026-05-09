export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-secondary flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <img
            src="/Refer%20Elk%20Grove.png"
            alt="Refer Elk Grove"
            className="mx-auto mb-3 drop-shadow-lg"
            style={{ height: 100, width: 'auto' }}
          />
          <p className="text-white/70 text-sm mt-1">Business Referral Network</p>
        </div>
        {children}
      </div>
    </div>
  )
}
