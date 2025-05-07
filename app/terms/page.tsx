'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function TermsPage() {
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

        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-transparent">Terms of Use</h1>
        <p className="text-muted-foreground mb-8">Last updated: January 2024</p>

        <div className="prose dark:prose-invert max-w-none">
          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-primary mb-4">1. Our Commitment</h2>
              <p className="text-muted-foreground leading-relaxed">
                At AkashChat, we strive to provide AI tools that can be used safely and responsibly while maximizing your control over how you use them. By using our services, you agree to adhere to our policies and guidelines outlined in these terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-primary mb-4">2. Service Evolution</h2>
              <p className="text-muted-foreground leading-relaxed">
                We believe that learning from real-world use is crucial for creating and releasing increasingly safe AI systems. As we cannot predict all beneficial or abusive uses of our technology, we actively monitor for new trends and adapt our policies based on what we learn over time.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-primary mb-4">3. Universal Policies</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                To maximize innovation while ensuring safety, you should have the flexibility to use AkashChat as you see fit, provided you comply with the law and don't cause harm. The following rules apply:
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Comply with all applicable laws and regulations</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Respect the privacy and rights of others</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Don't use our service to harm yourself or others</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Don't attempt to circumvent our safety measures or content filters</span>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-primary mb-4">4. Additional Policies</h2>
              <p className="text-muted-foreground leading-relaxed">
                Since we provide access to multiple AI models, you must follow the usage policies for each:
              </p>
              <ul className="space-y-2 text-muted-foreground ml-6 mt-2">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>
                    <a href="https://www.llama.com/llama3_3/use-policy" className="text-primary hover:underline">Llama Materials Acceptable Use Policy</a>
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>
                    <a href="https://github.com/deepseek-ai/DeepSeek-V3/blob/main/LICENSE-MODEL" className="text-primary hover:underline">DeepSeek V3 License and Usage Policy</a>
                  </span>
                </li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-2">
                These policies are incorporated by reference into this Agreement and are required to be followed when using our service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-primary mb-4">5. Prohibited Activities</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                The following activities are strictly prohibited:
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Generating content to harm, harass, or mislead others</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Creating or distributing malicious code or content</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Engaging in unauthorized surveillance or data collection</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Using the service for illegal activities or promoting harmful behavior</span>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-primary mb-4">6. Content Guidelines</h2>
              <p className="text-muted-foreground leading-relaxed">
                Users are responsible for the content they generate and share using AkashChat. Content must not promote hate speech, discrimination, violence, or illegal activities.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-primary mb-4">7. Safety and Monitoring</h2>
              <p className="text-muted-foreground leading-relaxed">
                We monitor service usage and may take action against users that violate our policies.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-primary mb-4">8. Account Actions</h2>
              <p className="text-muted-foreground leading-relaxed">
                Violations of these terms may result in actions against you, including warnings, temporary restrictions, or permanent suspension. We reserve the right to take appropriate action to maintain the safety and integrity of our service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-primary mb-4">9. Changes to Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may update these terms as our service evolves and we learn from user interactions. Continued use of AkashChat after changes constitutes acceptance of the updated terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-primary mb-4">10. Contact Information</h2>
              <p className="text-muted-foreground leading-relaxed">
                For questions about these Terms of Use or to report violations, please contact us through the appropriate channels provided on <Link href="https://akash.network" className="text-primary hover:underline">akash.network</Link>.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
} 