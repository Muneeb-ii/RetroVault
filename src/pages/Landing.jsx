// Landing page component for RetroVault
import NavBar from '../components/NavBar'
import Hero from '../components/Hero'
import Features from '../components/Features'
import HowItWorks from '../components/HowItWorks'
import Footer from '../components/Footer'
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { play } from '../utils/soundPlayer'

const Landing = () => {
  const { pathname } = useLocation()

  useEffect(() => {
    if (pathname === '/') {
      try { play('startup') } catch (e) {}
    }
  }, [pathname])
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation */}
      <NavBar />
      
      {/* Hero Section */}
      <Hero />
      
      {/* Features Section */}
      <Features />
      
      {/* How It Works Section */}
      <HowItWorks />
      
      {/* Footer */}
      <Footer />
    </div>
  )
}

export default Landing
