export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-secondary flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-accent rounded-2xl mb-4 shadow-lg">
            <span className="text-primary font-black text-2xl">RE</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Refer Elk Grove</h1>
          <p className="text-white/70 text-sm mt-1">Business Referral Network</p>
        </div>
        {children}
      </div>
    </div>
  )
}
