import LegalPage from "@/components/landing/legal-page"

export default function TermsPage() {
  return (
    <LegalPage title="Terms of service" updated="November 3, 2026">
      <p>By using Novella, you agree to use the service responsibly and in accordance with these terms.</p>
      <section><h2 className="font-sans text-3xl">Using Novella</h2><p className="mt-3">Keep your account details secure, use content you have the right to save, and do not misuse the service or attempt to disrupt it.</p></section>
      <section><h2 className="font-sans text-3xl">Your content</h2><p className="mt-3">You retain ownership of your notes and other content you add. You give Novella permission to store and process that content only to operate the service.</p></section>
      <section><h2 className="font-sans text-3xl">Changes</h2><p className="mt-3">We may update these terms as Novella develops. We will publish the latest version on this page.</p></section>
    </LegalPage>
  )
}
