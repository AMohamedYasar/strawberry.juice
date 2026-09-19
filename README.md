# 🍓 Pure Nectar — Luxury Scroll-Driven Strawberry Juice Showcase

A high-end, luxury scroll-driven product showcase and e-commerce experience built for an artisanal, cold-pressed strawberry juice brand.

The core visual experience features a 60 FPS frame-by-frame canvas animation synchronized with scroll position, complemented by inertia-based smooth scrolling, ambient glow backdrops, glassmorphism cards, Supabase authentication, and a secure checkout flow.

---

## ✨ Features

- **🎞️ Scroll-Driven Canvas Engine**: 42-frame high-resolution image sequence scrubbed smoothly via HTML5 Canvas API and `requestAnimationFrame` with aspect-ratio containment.
- **⏳ Smart Preloading Screen**: Preloads all sequence assets upfront with real-time percentage progress bar and smooth `AnimatePresence` exit animation.
- **🌊 Inertia Smooth Scrolling**: Integrated with Lenis (`@studio-freight/react-lenis`) for momentum-based, fluid scrolling across all devices.
- **💎 Luxury Dark Aesthetic**: Bespoke dark palette (`#050505` luxury black, `#FF1744` brand red, `#FF6B9D` brand coral) featuring frosted glassmorphism (`backdrop-filter: blur()`).
- **🎭 Micro-Interactions**: Framer Motion entry animations, scroll-triggered fade-ups, and interactive hover effects.
- **🔐 Supabase Authentication**: Full user authentication system powered by Supabase SSR (sign up, sign in, session middleware, and Google OAuth readiness).
- **🛍️ Secure Checkout & Validation**: Multi-step checkout with client and server-side validation for contact info, shipping address, and card details (input masking & CVC checks).
- **📦 Order Confirmation & Account Dashboard**: Real-time database insertion into Supabase `orders` table, dedicated order confirmation receipt page, and personal account dashboard with order history.

---

## 🛠️ Tech Stack

| Category | Technology |
|---|---|
| **Framework** | [Next.js 14](https://nextjs.org/) (App Router, Server Components & Server Actions) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/), PostCSS |
| **Typography** | [Outfit](https://fonts.google.com/specimen/Outfit) via `next/font/google` |
| **Animation** | [Framer Motion](https://www.framer.com/motion/), HTML5 Canvas API |
| **Smooth Scroll** | [Lenis](https://github.com/darkroomengineering/lenis) (`@studio-freight/react-lenis`) |
| **Backend & Auth** | [Supabase](https://supabase.com/) (`@supabase/ssr`, `@supabase/supabase-js`) |
| **Database** | PostgreSQL (hosted on Supabase) |

---

## 📁 Folder Structure

```text
juice/
├── app/
│   ├── account/                 # User dashboard & past order history
│   │   └── page.tsx
│   ├── actions/                 # Global server actions
│   │   └── order.ts
│   ├── auth/                    # OAuth callbacks
│   │   └── callback/
│   ├── error/                   # Dedicated luxury error handling page
│   │   └── page.tsx
│   ├── login/                   # Login & registration route
│   │   ├── actions.ts
│   │   └── page.tsx
│   ├── order/                   # Checkout flow & order confirmation
│   │   ├── confirmation/        # Order success receipt page
│   │   │   └── page.tsx
│   │   ├── actions.ts           # Order creation & validation server action
│   │   ├── CheckoutClient.tsx   # Interactive checkout form component
│   │   └── page.tsx             # Server-rendered checkout wrapper
│   ├── globals.css              # Global styles, scrollbar styling & Tailwind directives
│   ├── layout.tsx               # Root layout, Outfit font & Lenis provider
│   └── page.tsx                 # Homepage assembling all showcase sections
├── components/
│   ├── canvas/
│   │   └── SequenceCanvas.tsx   # Sticky canvas rendering frame sequence
│   ├── providers/
│   │   └── SmoothScrollProvider.tsx # Lenis smooth scroll provider
│   ├── ui/
│   │   ├── GlassCard.tsx        # Reusable frosted glass cards
│   │   ├── LoadingScreen.tsx    # Preloader with progress bar
│   │   └── SectionTitle.tsx     # Section typography component
│   ├── AuthForm.tsx             # Supabase Sign In / Sign Up modal component
│   ├── CTASection.tsx           # Call to action & pre-order button
│   ├── HeroSection.tsx          # Floating typography over sticky canvas
│   ├── IngredientsSection.tsx   # Product benefits with glassmorphism grid
│   └── StorySection.tsx         # Brand narrative with radial ambient glow
├── lib/
│   ├── imageLoader.ts           # Asset preloading & caching logic
│   └── useCanvasScroll.ts       # Canvas scroll calculation hook
├── public/
│   └── images/
│       └── sequence/            # 42 optimized sequence frames (ezgif-frame-*.png)
├── utils/
│   └── supabase/                # Supabase client, server & middleware configurations
│       ├── client.ts            # Browser client (anon key)
│       ├── middleware.ts        # Session refresh middleware
│       └── server.ts            # Server-side cookie-based client
├── middleware.ts                # Next.js route middleware for auth sessions
├── next.config.mjs              # Next.js configuration
├── tailwind.config.ts           # Custom colors & font configuration
├── tsconfig.json                # TypeScript compiler configuration
└── package.json                 # Dependencies and scripts
```

---

## 🚀 Getting Started

### 1. Prerequisites

Ensure you have installed:
- [Node.js](https://nodejs.org/) (version 18.17 or higher recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/) / [pnpm](https://pnpm.io/)
- A free [Supabase](https://supabase.com/) account & project

### 2. Installation

Clone the repository and install dependencies:

```bash
git clone <YOUR_REPOSITORY_URL>
cd juice
npm install
```

### 3. Environment Setup

Create a `.env.local` file in the root directory and add your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-publishable-key
```

> **Note:** Never commit `.env.local` or expose your Supabase `service_role` key in frontend code.

### 4. Database Setup (Supabase)

Run the following SQL query in your Supabase SQL Editor to create the `orders` table:

```sql
create table if not exists public.orders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  total_price numeric(10,2) not null,
  status text default 'Confirmed' not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.orders enable row level security;

-- Allow users to view their own orders
create policy "Users can view their own orders"
  on public.orders for select
  using (auth.uid() = user_id);

-- Allow authenticated users to create orders
create policy "Users can insert their own orders"
  on public.orders for insert
  with check (auth.uid() = user_id);
```

### 5. Run the Application

Start the local development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

---

## 📦 Production Build

To test the production build:

```bash
npm run build
npm start
```

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
