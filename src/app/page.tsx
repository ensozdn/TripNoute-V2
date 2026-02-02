'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { MapPin, Camera, BarChart3, Globe2 } from 'lucide-react';

export default function Page() {
  return (
    <div className="min-h-screen relative bg-slate-900">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-transparent to-transparent"></div>
      <div className="absolute inset-0 bg-gradient-to-tl from-blue-600/20 via-transparent to-transparent"></div>

      <div className="relative z-10">
        <header className="border-b border-white/10 bg-black/10 backdrop-blur-sm">
          <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-5">
            <nav className="flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity">
                <Image 
                  src="/tripnoute-logo.png" 
                  alt="TripNoute Logo" 
                  width={40} 
                  height={40}
                  className="rounded-xl"
                />
                <span className="text-xl font-semibold text-white">TripNoute</span>
              </Link>

              <div className="flex items-center gap-2 sm:gap-4">
                <Link href="/login">
                  <Button 
                    variant="ghost" 
                    className="text-slate-300 hover:text-white hover:bg-white/10 text-sm sm:text-base px-3 sm:px-4"
                  >
                    Login
                  </Button>
                </Link>
                <Link href="/register">
                  <Button 
                    className="bg-blue-600 hover:bg-blue-700 text-white text-sm sm:text-base px-3 sm:px-6"
                  >
                    <span className="hidden sm:inline">Get Started</span>
                    <span className="sm:hidden">Start</span>
                  </Button>
                </Link>
              </div>
            </nav>
          </div>
        </header>

        <section className="container mx-auto px-4 sm:px-6 py-12 sm:py-20 md:py-24 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 sm:mb-6">
            Your Personal
            <span className="block text-blue-400 mt-2">Travel Journal</span>
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-slate-300 mb-6 sm:mb-8 max-w-2xl mx-auto px-4">
            Document your travels with location, photos, and notes. 
            Build your digital travel map as you explore the world.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
            <Link href="/register" className="w-full sm:w-auto">
              <Button 
                size="lg" 
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6"
              >
                Start Your Journey
              </Button>
            </Link>
            <Link href="#features" className="w-full sm:w-auto">
              <Button 
                size="lg" 
                variant="outline" 
                className="w-full sm:w-auto border-white/20 text-white hover:bg-white/10 text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6"
              >
                Learn More
              </Button>
            </Link>
          </div>
        </section>

        <section id="features" className="container mx-auto px-4 sm:px-6 py-12 sm:py-20">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center text-white mb-8 sm:mb-12">
            Everything You Need to Track Your Adventures
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="p-6 rounded-2xl bg-white/10 border border-white/20 hover:bg-white/[0.12] transition-all">
              <div className="h-12 w-12 rounded-xl bg-blue-500/20 flex items-center justify-center mb-4">
                <MapPin className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2">Track Locations</h3>
              <p className="text-sm sm:text-base text-slate-400">
                Mark every place you visit on your personal travel map with precise coordinates.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/10 border border-white/20 hover:bg-white/[0.12] transition-all">
              <div className="h-12 w-12 rounded-xl bg-blue-500/20 flex items-center justify-center mb-4">
                <Camera className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2">Save Memories</h3>
              <p className="text-sm sm:text-base text-slate-400">
                Upload photos and write notes for each location to preserve your memories.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/10 border border-white/20 hover:bg-white/[0.12] transition-all">
              <div className="h-12 w-12 rounded-xl bg-blue-500/20 flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2">View Statistics</h3>
              <p className="text-sm sm:text-base text-slate-400">
                See how many countries and cities you've visited with beautiful stats.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/10 border border-white/20 hover:bg-white/[0.12] transition-all">
              <div className="h-12 w-12 rounded-xl bg-blue-500/20 flex items-center justify-center mb-4">
                <Globe2 className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2">Interactive Map</h3>
              <p className="text-sm sm:text-base text-slate-400">
                Visualize your journey on an interactive world map with all your places.
              </p>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 sm:px-6 py-12 sm:py-20">
          <div className="rounded-2xl p-8 sm:p-12 bg-gradient-to-br from-blue-600/30 to-blue-500/20 backdrop-blur-md border border-blue-400/30 text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Start Your Travel Journey?
            </h2>
            <p className="text-base sm:text-lg text-slate-300 mb-6 sm:mb-8 max-w-2xl mx-auto">
              Join thousands of travelers documenting their adventures.
            </p>
            <Link href="/register">
              <Button 
                size="lg" 
                className="bg-blue-600 hover:bg-blue-700 text-white text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6"
              >
                Create Free Account
              </Button>
            </Link>
          </div>
        </section>

        <footer className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 border-t border-white/10">
          <div className="text-center text-slate-400 text-sm sm:text-base">
            <p>&copy; 2026 TripNoute. Built with passion for travelers worldwide.</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
