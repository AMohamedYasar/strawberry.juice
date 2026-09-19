import SequenceCanvas from "@/components/canvas/SequenceCanvas";
import HeroSection from "@/components/HeroSection";
import StorySection from "@/components/StorySection";
import IngredientsSection from "@/components/IngredientsSection";
import CTASection from "@/components/CTASection";
import OrderSection from "@/components/OrderSection";

export default function Home() {
  return (
    <main className="relative w-full bg-luxury-black text-white selection:bg-brand-coral selection:text-white">
      {/* Background Canvas (Sticky) */}
      <div className="absolute inset-0 z-0">
         <SequenceCanvas />
      </div>

      {/* Foreground scrollable content */}
      <div className="relative z-10 flex flex-col">
        <HeroSection />
        <div className="h-[50vh]"></div>
        
        <StorySection />
        <div className="h-[50vh]"></div>
        
        <IngredientsSection />
        <div className="h-[30vh]"></div>
        
        <CTASection />

        {/* Integrated Order Section pinned directly on the homepage */}
        <div id="order">
          <OrderSection />
        </div>
      </div>
    </main>
  );
}
// import Link from 'next/link'

// export default function Home() {
//   return (
//     <div style={{ textAlign: 'center', marginTop: '50px' }}>
//       <h1>Welcome to My Website</h1>

//       <Link href="/login">
//         <button style={{ padding: '10px 20px', marginTop: '20px' }}>
//           Go to Login
//         </button>
//       </Link>
//     </div>
//   )
// }