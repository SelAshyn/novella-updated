import LegalPage from "@/components/landing/legal-page"

export default function CookiesPage() {
  return (
    <LegalPage title="Cookie policy" updated="November 3, 2026">
      <p>Novella uses cookies and similar browser storage to keep the site working and remember your preferences.</p>
      <section><h2 className="font-sans text-3xl">Essential cookies</h2><p className="mt-3">These support sessions, security, theme preferences, and core product functionality.</p></section>
      <section><h2 className="font-sans text-3xl">Your choices</h2><p className="mt-3">You can manage cookies through your browser settings. Disabling essential cookies may prevent parts of Novella from working.</p></section>
    </LegalPage>
  )
}
