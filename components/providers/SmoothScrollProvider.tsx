"use client";

import { ReactLenis } from "@studio-freight/react-lenis";

export default function SmoothScrollProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ReactLenis root options={{ lerp: 0.1, duration: 1.5, smoothWheel: true }}>
      {children}
    </ReactLenis>
  );
}

// "use client";

// import { ReactLenis } from "lenis/react";

// export default function SmoothScrollProvider({
//   children,
// }: {
//   children: React.ReactNode;
// }) {
//   return (
//     <ReactLenis
//       root
//       options={{
//         lerp: 0.1,
//         duration: 1.5,
//         smoothWheel: true,
//       }}
//     >
//       {children}
//     </ReactLenis>
//   );
// }