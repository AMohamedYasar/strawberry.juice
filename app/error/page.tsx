import Link from "next/link";

export default function ErrorPage({
  searchParams,
}: {
  searchParams: { message?: string }
}) {
  const errorMessage = searchParams.message || "Sorry, there was an issue logging in or setting up your account. Please check your credentials and try again."

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-luxury-black text-white relative z-10 px-6 text-center">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-red/10 rounded-full blur-[120px] pointer-events-none -z-10" />
      
      <h1 className="text-4xl md:text-5xl font-light tracking-widest text-brand-red mb-8 uppercase text-glow drop-shadow-2xl">
        Authentication Failed
      </h1>
      <p className="text-white/60 text-lg mb-10 max-w-lg font-light">
        {errorMessage}
      </p>
      
      <Link href="/login" className="rounded-full px-10 py-5 bg-white text-black font-semibold tracking-widest text-sm uppercase hover:bg-brand-coral hover:text-white transition-all duration-300 shadow-[0_0_20px_rgba(255,107,157,0.2)] hover:shadow-[0_0_40px_rgba(255,107,157,0.5)]">
        Return to Login
      </Link>
    </div>
  )
}
