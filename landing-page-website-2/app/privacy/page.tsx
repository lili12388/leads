import React from "react"

export const metadata = {
  title: "Privacy Policy",
  description: "Privacy policy for MapsReach - how we collect and use data",
}

export default function PrivacyPage() {
  return (
    <main className="bg-background text-foreground min-h-screen py-16">
      <div className="max-w-4xl mx-auto px-6">
        <h1 className="text-4xl font-extrabold mb-4">Privacy Policy</h1>
        <p className="text-muted-foreground mb-6">Effective date: January 14, 2026</p>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-2">Overview</h2>
          <p className="text-base text-muted-foreground">
            MapsReach (“we”, “us”, or “our”) respects your privacy. This Privacy Policy explains what
            information we collect, how we use it, and the choices you have. By using our website and
            services you agree to the terms described here.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-2">Information We Collect</h2>
          <p className="text-base text-muted-foreground">
            We collect information you provide directly (for example, email address when you contact
            support), and information collected automatically such as cookies, usage data, and device
            identifiers. We may also store affiliate/referral codes in localStorage or cookies to
            support referral tracking and customer experience.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-2">How We Use Information</h2>
          <p className="text-base text-muted-foreground">
            We use collected data to operate and improve our services, process transactions, provide
            support, personalize content, and for analytics and fraud prevention. We do not sell
            personal information to third parties.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-2">Cookies & Tracking</h2>
          <p className="text-base text-muted-foreground">
            We use cookies and similar technologies to remember preferences, enable features (for
            example referral persistence), and measure site performance. Third-party services such as
            analytics providers may set their own cookies; their use is governed by their own
            policies.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-2">Third-Party Services</h2>
          <p className="text-base text-muted-foreground">
            We may share limited information with service providers who help provide our services
            (payment processors, analytics, support chat). These providers are permitted to use
            your data only as necessary to perform their services for us.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-2">Data Retention & Security</h2>
          <p className="text-base text-muted-foreground">
            We retain data as long as necessary to provide the service and comply with legal
            obligations. We implement reasonable technical and organizational measures to protect
            data, but cannot guarantee absolute security.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-2">Children</h2>
          <p className="text-base text-muted-foreground">
            Our services are not directed to children under 16. We do not knowingly collect
            information from children under that age. If you believe we have collected such data,
            contact us and we will take steps to delete it.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-2">Changes to This Policy</h2>
          <p className="text-base text-muted-foreground">
            We may update this Privacy Policy from time to time. We will post the updated policy
            on this page and update the Effective date. Continued use of the service after changes
            indicates acceptance.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-2">Contact Us</h2>
          <p className="text-base text-muted-foreground">
            For questions or requests regarding privacy, please email our support team at
            <a className="text-primary hover:underline" href="mailto:laithou123@gmail.com"> laithou123@gmail.com</a>.
          </p>
        </section>

        <p className="text-sm text-muted-foreground">Last updated: January 14, 2026</p>
      </div>
    </main>
  )
}
