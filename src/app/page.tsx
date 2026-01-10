/**
 * TripNoute v2 - Landing Page
 * 
 * The homepage for non-authenticated users.
 * Shows app features and encourages sign-up.
 */

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-cyan-50 to-white">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-lg bg-cyan-500 flex items-center justify-center text-white font-bold text-xl">
              T
            </div>
            <span className="text-2xl font-bold text-cyan-700">TripNoute</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link href="/register">
              <Button>Get Started</Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl font-bold text-cyan-700 mb-6">
          Your Personal Travel Journal
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Document your travels with location, photos, and notes. 
          Build your digital travel map as you explore the world.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/register">
            <Button size="lg" className="text-lg px-8">
              Start Your Journey
            </Button>
          </Link>
          <Link href="#features">
            <Button size="lg" variant="outline" className="text-lg px-8">
              Learn More
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center text-cyan-700 mb-12">
          Everything You Need to Track Your Adventures
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="p-6">
            <div className="h-12 w-12 rounded-lg bg-cyan-100 flex items-center justify-center mb-4">
              <span className="text-2xl">📍</span>
            </div>
            <h3 className="text-xl font-bold mb-2">Track Locations</h3>
            <p className="text-gray-600">
              Mark every place you visit on your personal travel map with precise coordinates.
            </p>
          </Card>

          <Card className="p-6">
            <div className="h-12 w-12 rounded-lg bg-cyan-100 flex items-center justify-center mb-4">
              <span className="text-2xl">📸</span>
            </div>
            <h3 className="text-xl font-bold mb-2">Save Memories</h3>
            <p className="text-gray-600">
              Upload photos and write notes for each location to preserve your memories.
            </p>
          </Card>

          <Card className="p-6">
            <div className="h-12 w-12 rounded-lg bg-cyan-100 flex items-center justify-center mb-4">
              <span className="text-2xl">📊</span>
            </div>
            <h3 className="text-xl font-bold mb-2">View Statistics</h3>
            <p className="text-gray-600">
              See how many countries and cities you've visited with beautiful stats.
            </p>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="bg-cyan-500 rounded-2xl p-12 text-white">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Start Your Travel Journey?
          </h2>
          <p className="text-lg mb-8 opacity-90">
            Join thousands of travelers documenting their adventures.
          </p>
          <Link href="/register">
            <Button size="lg" variant="secondary" className="text-lg px-8">
              Create Free Account
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 border-t">
        <div className="text-center text-gray-600">
          <p>&copy; 2026 TripNoute. Built with passion for travelers worldwide.</p>
        </div>
      </footer>
    </div>
  );
}
