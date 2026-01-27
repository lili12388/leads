import React from "react"

export const metadata = {
  title: "Terms of Service",
  description: "Terms of Service for MapsReach - rules and guidelines for using our service",
}

export default function TermsPage() {
  return (
    <main className="bg-background text-foreground min-h-screen py-16">
      <div className="max-w-4xl mx-auto px-6">
        <h1 className="text-4xl font-extrabold mb-4">Terms of Service</h1>
        <p className="text-muted-foreground mb-6">Effective date: January 21, 2026</p>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-2">1. Acceptance of Terms</h2>
          <p className="text-base text-muted-foreground">
            By accessing or using MapsReach ("the Service"), you agree to be bound by these Terms of
            Service. If you do not agree to these terms, do not use the Service. We reserve the right
            to modify these terms at any time, and your continued use constitutes acceptance of any
            changes.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-2">2. Description of Service</h2>
          <p className="text-base text-muted-foreground">
            MapsReach is a software tool that helps users extract business data from Google Maps and
            send outreach messages via WhatsApp and email. The Service is provided "as is" and we make
            no guarantees regarding the accuracy of extracted data or the deliverability of messages.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-2">3. License and Usage</h2>
          <p className="text-base text-muted-foreground">
            Upon purchasing a license, you are granted a non-exclusive, non-transferable right to use
            the MapsReach software. Each license is valid for one user and may not be shared, resold,
            or sublicensed. We reserve the right to revoke licenses that violate these terms.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-2">4. User Responsibilities</h2>
          <p className="text-base text-muted-foreground">
            You agree to use MapsReach in compliance with all applicable laws, including but not
            limited to anti-spam laws (CAN-SPAM, GDPR, etc.), data protection regulations, and
            WhatsApp's Terms of Service. You are solely responsible for:
          </p>
          <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
            <li>Obtaining proper consent before contacting businesses or individuals</li>
            <li>The content of messages you send through the Service</li>
            <li>Ensuring your use complies with local and international laws</li>
            <li>Any consequences resulting from your use of the Service</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-2">5. Prohibited Uses</h2>
          <p className="text-base text-muted-foreground">
            You may not use MapsReach to:
          </p>
          <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
            <li>Send spam, unsolicited bulk messages, or harassing content</li>
            <li>Violate any applicable laws or third-party rights</li>
            <li>Impersonate any person or entity</li>
            <li>Attempt to reverse engineer, decompile, or modify the software</li>
            <li>Circumvent any security measures or licensing restrictions</li>
            <li>Use the Service for any illegal or fraudulent purposes</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-2">6. Third-Party Services</h2>
          <p className="text-base text-muted-foreground">
            MapsReach integrates with third-party services including Google Maps, WhatsApp, and email
            providers. Your use of these services is subject to their respective terms of service.
            We are not responsible for any changes, limitations, or account restrictions imposed by
            these third parties.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-2">7. Payment and Refunds</h2>
          <p className="text-base text-muted-foreground">
            License payments are processed through secure third-party payment processors. Due to the
            digital nature of the product, all sales are final. Refunds may be considered on a
            case-by-case basis within 7 days of purchase if the software is demonstrably
            non-functional and we are unable to resolve the issue.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-2">8. Disclaimer of Warranties</h2>
          <p className="text-base text-muted-foreground">
            THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND,
            EXPRESS OR IMPLIED. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE,
            OR SECURE. WE MAKE NO GUARANTEES REGARDING THE ACCURACY OF DATA EXTRACTED OR THE SUCCESS
            OF YOUR OUTREACH CAMPAIGNS.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-2">9. Limitation of Liability</h2>
          <p className="text-base text-muted-foreground">
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, MAPSREACH AND ITS AFFILIATES SHALL NOT BE LIABLE
            FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS
            OF PROFITS, DATA, OR BUSINESS OPPORTUNITIES, ARISING FROM YOUR USE OF THE SERVICE. OUR
            TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT YOU PAID FOR THE LICENSE.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-2">10. Indemnification</h2>
          <p className="text-base text-muted-foreground">
            You agree to indemnify, defend, and hold harmless MapsReach, its officers, directors,
            employees, and agents from any claims, liabilities, damages, losses, or expenses arising
            from your use of the Service, your violation of these Terms, or your violation of any
            rights of a third party.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-2">11. Termination</h2>
          <p className="text-base text-muted-foreground">
            We reserve the right to terminate or suspend your license at any time, without prior
            notice, for conduct that we believe violates these Terms or is harmful to other users,
            us, or third parties. Upon termination, your right to use the Service will immediately
            cease.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-2">12. Governing Law</h2>
          <p className="text-base text-muted-foreground">
            These Terms shall be governed by and construed in accordance with the laws of the
            jurisdiction in which MapsReach operates, without regard to its conflict of law
            provisions. Any disputes arising from these Terms shall be resolved in the appropriate
            courts of that jurisdiction.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-2">13. Contact Us</h2>
          <p className="text-base text-muted-foreground">
            If you have any questions about these Terms of Service, please contact us at
            <a className="text-primary hover:underline" href="mailto:laithou123@gmail.com"> laithou123@gmail.com</a>.
          </p>
        </section>

        <p className="text-sm text-muted-foreground">Last updated: January 21, 2026</p>
      </div>
    </main>
  )
}
