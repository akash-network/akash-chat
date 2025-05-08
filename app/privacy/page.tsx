'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-6 md:p-8">
        <div className="mb-8">
          <Link 
            href="/" 
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors rounded-lg px-3 py-2 hover:bg-accent"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Chat
          </Link>
        </div>
        
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-transparent">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">Last updated: January 2024</p>
        
        <div className="prose dark:prose-invert max-w-none">
          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-primary mb-4">1. Introduction</h2>
              <p className="text-muted-foreground leading-relaxed">
                This Privacy Policy explains how AkashChat collects, uses, and protects your personal information. We are committed to ensuring your privacy and protecting any information you share with us.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-primary mb-4">2. Information We Collect</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We collect the following types of information:
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Technical information such as browser type and device information</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Usage data to improve our service</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Cookies and similar tracking technologies</span>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-primary mb-4">3. How We Use Your Information</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We use your information to:
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Provide and maintain our chat service</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Improve and personalize your experience</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Analyze usage patterns and optimize performance</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Ensure the security and reliability of our service</span>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-primary mb-4">4. Data Storage and Security</h2>
              <p className="text-muted-foreground leading-relaxed">
                We implement appropriate security measures to protect your information from unauthorized access, alteration, disclosure, or destruction.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-primary mb-4">5. Data Sharing and Disclosure</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We do not sell your personal information. We may share your information in the following circumstances:
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>When required by law or legal process</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>To protect our rights, privacy, safety, or property</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>With service providers who assist in operating our service</span>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-primary mb-4">6. Your Rights and Choices</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                You have the right to:
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Access your personal information</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Request correction of inaccurate data</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Request deletion of your data</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Opt-out of certain data collection practices</span>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-primary mb-4">7. Cookies and Tracking</h2>
              <p className="text-muted-foreground leading-relaxed">
                We use cookies and similar tracking technologies to enhance your experience and collect usage data. You can control cookie settings through your browser preferences.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-primary mb-4">8. Children's Privacy</h2>
              <p className="text-muted-foreground leading-relaxed">
                Our service is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-primary mb-4">9. Changes to Privacy Policy</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new Privacy Policy on this page.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-primary mb-4">10. Contact Us</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have questions about this Privacy Policy, please contact us through the appropriate channels provided on <Link href="https://akash.network" className="text-primary hover:underline">akash.network</Link>.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
} 