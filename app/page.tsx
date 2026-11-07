"use client"

import Hero from "@/components/landing/hero"
import HowItWorks from "@/components/landing/how-it-works"
import TheLoop from "@/components/landing/the-loop"
import WhatsInside from "@/components/landing/whats-inside"
import BuiltFor from "@/components/landing/built-for"
import Comparison from "@/components/landing/comparison"
import ForSchools from "@/components/landing/for-schools"
import Questions from "@/components/landing/questions"
import FinalCta from "@/components/landing/final-cta"
import SectionSnap from "@/components/landing/snap-scroll"
import Navbar from "@/components/landing/navbar"
import AuthRedirect from "@/components/landing/auth-redirect"
import BackToTop from "@/components/landing/back-to-top"
import CookieConsent from "@/components/landing/cookie-consent"

export default function Page() {
  return (
    <AuthRedirect>
      <Navbar />
      <div
        id="top"
        className="min-w-0 snap-container"
      >
        <SectionSnap />
        <Hero />
        <HowItWorks />
        <TheLoop />
        <WhatsInside />
        <BuiltFor />
        <Comparison />
        <ForSchools />
        <Questions />
        <FinalCta />
      </div>
      <BackToTop />
      <CookieConsent />
    </AuthRedirect>
  )
}
