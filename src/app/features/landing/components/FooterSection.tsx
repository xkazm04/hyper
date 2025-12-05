'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Github, Twitter, Heart } from 'lucide-react'

// ============================================================================
// Footer Section
// ============================================================================

export function FooterSection() {
  const router = useRouter()

  const handleDemoMode = () => {
    localStorage.setItem('demoMode', 'true')
    document.cookie = 'demoMode=true; path=/; max-age=86400'
    router.push('/dashboard')
  }

  return (
    <footer className="relative z-10 py-12 border-t-4 border-border bg-card/50 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <div>
            <h3 className="font-bold text-lg mb-3 text-foreground">HyperCard Renaissance</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Reimagining HyperCard for the modern web. Create interactive stories with AI-powered tools.
            </p>
          </div>

          {/* Social */}
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-3">
              Connect
            </h4>
            <div className="flex gap-4">
              <motion.a
                href="https://github.com/xkazm04/hyper"
                whileHover={{ scale: 1.1, y: -2 }}
                className="w-10 h-10 bg-card border-2 border-border rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary transition-colors"
              >
                <Github className="w-5 h-5" />
              </motion.a>
              <motion.a
                href="https://x.com/xkazm04"
                whileHover={{ scale: 1.1, y: -2 }}
                className="w-10 h-10 bg-card border-2 border-border rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary transition-colors"
              >
                <Twitter className="w-5 h-5" />
              </motion.a>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            Made with 👻 Kiro 👻 for dreamers.
          </p>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} HyperCard Renaissance. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
