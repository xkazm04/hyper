# Phase 1: Foundation & Authentication

## Objective
Set up the Next.js project with Supabase integration, implement authentication, and create the basic application shell.

## Tasks

### 1.1 Project Initialization

**Create Next.js Project**
```bash
npx create-next-app@latest hypercard-renaissance --typescript --tailwind --app --no-src-dir
cd hypercard-renaissance
```

**Install Core Dependencies**
```bash
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
npm install framer-motion
npm install lucide-react class-variance-authority clsx tailwind-merge
npm install @radix-ui/react-slot @radix-ui/react-dialog @radix-ui/react-dropdown-menu
npm install cmdk
```

**Install Dev Dependencies**
```bash
npm install -D @types/node
```

### 1.2 Supabase Setup

**Initialize Supabase Project**
1. Create new project at supabase.com
2. Note down:
   - Project URL
   - Anon/Public Key
   - Service Role Key (for migrations)

**Create Environment Files**

`.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

`.env.example`:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

**Create Supabase Client Utilities**

`lib/supabase/client.ts`:
```typescript
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from './database.types'

export const createClient = () => createClientComponentClient<Database>()
```

`lib/supabase/server.ts`:
```typescript
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Database } from './database.types'

export const createServerClient = () => {
  const cookieStore = cookies()
  return createServerComponentClient<Database>({ cookies: () => cookieStore })
}
```

`lib/supabase/middleware.ts`:
```typescript
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  await supabase.auth.getSession()
  return res
}

export const config = {
  matcher: ['/dashboard/:path*', '/editor/:path*'],
}
```

### 1.3 Database Schema (Initial)

**Create Migration File**: `supabase/migrations/00001_initial_schema.sql`

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Function to handle user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'username',
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 1.4 TypeScript Types

**Generate Database Types**
```bash
npx supabase gen types typescript --project-id your_project_id > lib/supabase/database.types.ts
```

**Create Base Types**: `lib/types/index.ts`

```typescript
export interface User {
  id: string
  email: string
  username?: string
  fullName?: string
  avatarUrl?: string
  createdAt: string
}

export interface Session {
  user: User
  accessToken: string
  refreshToken: string
}
```

### 1.5 Authentication UI

**Auth Context**: `lib/auth/AuthContext.tsx`

```typescript
'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, username: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  const signUp = async (email: string, password: string, username: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username },
      },
    })
    if (error) throw error
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
```

**Login Page**: `app/login/page.tsx`

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const { signIn, signUp } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      if (isSignUp) {
        await signUp(email, password, username)
      } else {
        await signIn(email, password)
      }
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md p-8">
        <h1 className="text-2xl font-bold mb-6 text-center">
          HyperCard Renaissance
        </h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          
          {isSignUp && (
            <Input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          )}
          
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          
          {error && <p className="text-red-500 text-sm">{error}</p>}
          
          <Button type="submit" className="w-full">
            {isSignUp ? 'Sign Up' : 'Sign In'}
          </Button>
        </form>
        
        <button
          onClick={() => setIsSignUp(!isSignUp)}
          className="mt-4 text-sm text-blue-600 hover:underline w-full text-center"
        >
          {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
        </button>
      </Card>
    </div>
  )
}
```

### 1.6 Layout & Navigation

**Root Layout**: `app/layout.tsx`

```typescript
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/lib/auth/AuthContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'HyperCard Renaissance',
  description: 'Create interactive stacks with modern technology',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
```

**Dashboard Layout Placeholder**: `app/dashboard/layout.tsx`

```typescript
'use client'

import { useAuth } from '@/lib/auth/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  )
}
```

### 1.7 shadcn/ui Setup

**Initialize shadcn**
```bash
npx shadcn-ui@latest init
```

**Add Components**
```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
npx shadcn-ui@latest add card
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add dropdown-menu
```

### 1.8 Tailwind Configuration

**Update `tailwind.config.ts`** with HyperCard-inspired theme:

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        hypercard: {
          black: '#000000',
          white: '#FFFFFF',
          gray: {
            50: '#F7F7F7',
            100: '#E5E5E5',
            200: '#CCCCCC',
            300: '#B3B3B3',
            400: '#999999',
            500: '#808080',
            600: '#666666',
            700: '#4D4D4D',
            800: '#333333',
            900: '#1A1A1A',
          },
          blue: {
            DEFAULT: '#0066CC',
            light: '#3399FF',
            dark: '#004C99',
          },
        },
      },
      fontFamily: {
        mono: ['SF Mono', 'Monaco', 'Inconsolata', 'monospace'],
      },
      boxShadow: {
        'hypercard': '2px 2px 0px 0px rgba(0,0,0,1)',
        'hypercard-hover': '3px 3px 0px 0px rgba(0,0,0,1)',
      },
    },
  },
  plugins: [],
}
export default config
```

## Deliverables Checklist

- [ ] Next.js project initialized with TypeScript and Tailwind
- [ ] Supabase project created and configured
- [ ] Environment variables set up
- [ ] Database schema deployed (profiles table)
- [ ] Authentication context and hooks implemented
- [ ] Login/signup page functional
- [ ] Dashboard layout with auth protection
- [ ] shadcn/ui components installed
- [ ] HyperCard-inspired theme configured
- [ ] All types generated and imported correctly

## Testing Checklist

- [ ] User can sign up with email/password
- [ ] User can sign in with existing credentials
- [ ] User is redirected to dashboard after auth
- [ ] Unauthenticated users are redirected to login
- [ ] User can sign out
- [ ] Profile is created automatically on signup
- [ ] Session persists on page reload

## Next Phase
Proceed to `02-PHASE-2-DATA-MODELS.md` for stack and card data models.