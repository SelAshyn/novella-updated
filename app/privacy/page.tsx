import LegalPage from "@/components/landing/legal-page"

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy policy" updated="November 3, 2026">
      <p>Novella is built to help you remember what you read. We collect only the information needed to provide and improve that service.</p>
      <section><h2 className="font-sans text-3xl">Information we collect</h2><p className="mt-3">This may include account details, books you add, notes, saved words, and basic usage information. We do not sell your personal information.</p></section>
      <section><h2 className="font-sans text-3xl">How we use it</h2><p className="mt-3">We use your information to store your notebook, provide reviews, answer questions about your saved library, and keep the service secure.</p></section>
      <section><h2 className="font-sans text-3xl">Your choices</h2><p className="mt-3">You may request access to, correction of, or deletion of your personal information by contacting the Novella team.</p></section>
    </LegalPage>
  )
}
