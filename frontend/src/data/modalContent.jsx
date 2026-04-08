import React from 'react';

export const modalContent = {
  privacy: {
    title: 'Privacy Policy',
    content: (
      <div className="space-y-6">
        <p className="text-lg font-semibold">Effective Date: January 1, 2025</p>
        
        <section>
          <h3 className="text-xl font-bold mb-3">1. Information We Collect</h3>
          <p className="mb-2">At Rosch Capital Bank, we collect information to provide you with secure and efficient banking services:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Personal Information:</strong> Name, email address, phone number, date of birth, and government-issued ID</li>
            <li><strong>Financial Information:</strong> Account numbers, transaction history, and payment information</li>
            <li><strong>Technical Information:</strong> IP address, device information, browser type, and usage data</li>
            <li><strong>Location Data:</strong> Geographic location for fraud prevention and service optimization</li>
          </ul>
        </section>

        <section>
          <h3 className="text-xl font-bold mb-3">2. How We Use Your Information</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>Process transactions and manage your accounts</li>
            <li>Verify your identity and prevent fraud</li>
            <li>Provide customer support and respond to inquiries</li>
            <li>Improve our services and develop new features</li>
            <li>Comply with legal and regulatory requirements</li>
            <li>Send important account notifications and updates</li>
          </ul>
        </section>

        <section>
          <h3 className="text-xl font-bold mb-3">3. Information Sharing</h3>
          <p className="mb-2">We do not sell your personal information. We may share your data with:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Service providers who assist in operating our platform</li>
            <li>Financial institutions for transaction processing</li>
            <li>Law enforcement when required by law</li>
            <li>Third parties with your explicit consent</li>
          </ul>
        </section>

        <section>
          <h3 className="text-xl font-bold mb-3">4. Data Security</h3>
          <p>We employ industry-standard security measures including 256-bit encryption, two-factor authentication, and continuous monitoring to protect your information. All data is stored on secure servers with restricted access.</p>
        </section>

        <section>
          <h3 className="text-xl font-bold mb-3">5. Your Rights</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>Access and review your personal information</li>
            <li>Request corrections to inaccurate data</li>
            <li>Delete your account and associated data</li>
            <li>Opt-out of marketing communications</li>
            <li>Export your data in a portable format</li>
          </ul>
        </section>

        <section>
          <h3 className="text-xl font-bold mb-3">6. Contact Us</h3>
          <p>For privacy-related questions or concerns, contact us at:</p>
          <p className="mt-2"><strong>Email:</strong> privacy@roschcapital.com</p>
          <p><strong>Phone:</strong> +1 (234) 567-890</p>
        </section>
      </div>
    )
  },

  terms: {
    title: 'Terms of Service',
    content: (
      <div className="space-y-6">
        <p className="text-lg font-semibold">Last Updated: January 1, 2025</p>
        
        <section>
          <h3 className="text-xl font-bold mb-3">1. Acceptance of Terms</h3>
          <p>By accessing or using Rosch Capital Bank services, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.</p>
        </section>

        <section>
          <h3 className="text-xl font-bold mb-3">2. Account Registration</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>You must be at least 18 years old to open an account</li>
            <li>You must provide accurate and complete information</li>
            <li>You are responsible for maintaining account security</li>
            <li>One person may not maintain multiple accounts</li>
            <li>You must notify us immediately of any unauthorized access</li>
          </ul>
        </section>

        <section>
          <h3 className="text-xl font-bold mb-3">3. Account Usage</h3>
          <p className="mb-2">You agree to use your account only for lawful purposes. Prohibited activities include:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Money laundering or terrorist financing</li>
            <li>Fraud, scams, or deceptive practices</li>
            <li>Violation of any applicable laws or regulations</li>
            <li>Unauthorized access to other accounts</li>
            <li>Circumventing security measures</li>
          </ul>
        </section>

        <section>
          <h3 className="text-xl font-bold mb-3">4. Fees and Charges</h3>
          <p>Rosch Capital Bank offers fee-free personal banking. However, certain services may incur charges:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>International wire transfers: Variable fees based on destination</li>
            <li>Expedited card delivery: $25</li>
            <li>Paper statement requests: $5 per statement</li>
            <li>Overdraft protection: As disclosed in your account agreement</li>
          </ul>
        </section>

        <section>
          <h3 className="text-xl font-bold mb-3">5. Transactions</h3>
          <p>All transactions are subject to verification and may be delayed or rejected for security reasons. We reserve the right to reverse transactions if fraud is suspected or if errors occur.</p>
        </section>

        <section>
          <h3 className="text-xl font-bold mb-3">6. Account Termination</h3>
          <p>We may suspend or terminate your account if you violate these terms, engage in prohibited activities, or if required by law. You may close your account at any time by contacting customer support.</p>
        </section>

        <section>
          <h3 className="text-xl font-bold mb-3">7. Limitation of Liability</h3>
          <p>Rosch Capital Bank is not liable for indirect, incidental, or consequential damages arising from your use of our services, except as required by law.</p>
        </section>

        <section>
          <h3 className="text-xl font-bold mb-3">8. Changes to Terms</h3>
          <p>We may update these terms at any time. Continued use of our services after changes constitutes acceptance of the new terms.</p>
        </section>
      </div>
    )
  },

  cookies: {
    title: 'Cookie Policy',
    content: (
      <div className="space-y-6">
        <p className="text-lg font-semibold">Effective Date: January 1, 2025</p>
        
        <section>
          <h3 className="text-xl font-bold mb-3">1. What Are Cookies?</h3>
          <p>Cookies are small text files stored on your device when you visit our website. They help us provide a better user experience and improve our services.</p>
        </section>

        <section>
          <h3 className="text-xl font-bold mb-3">2. Types of Cookies We Use</h3>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-bold text-lg mb-2">Essential Cookies</h4>
              <p>Required for the website to function properly. These cookies enable core functionality such as security, network management, and accessibility.</p>
            </div>

            <div>
              <h4 className="font-bold text-lg mb-2">Performance Cookies</h4>
              <p>Collect information about how you use our website, such as which pages you visit most often. This data helps us optimize our platform.</p>
            </div>

            <div>
              <h4 className="font-bold text-lg mb-2">Functional Cookies</h4>
              <p>Remember your preferences and settings to provide a personalized experience, such as language preferences and login information.</p>
            </div>

            <div>
              <h4 className="font-bold text-lg mb-2">Analytics Cookies</h4>
              <p>Help us understand user behavior and improve our services. We use tools like Google Analytics to track website usage.</p>
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-xl font-bold mb-3">3. Third-Party Cookies</h3>
          <p className="mb-2">We may use third-party services that set cookies on your device:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Google Analytics for website analytics</li>
            <li>Payment processors for transaction security</li>
            <li>Customer support tools for live chat functionality</li>
          </ul>
        </section>

        <section>
          <h3 className="text-xl font-bold mb-3">4. Managing Cookies</h3>
          <p className="mb-2">You can control cookies through your browser settings:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Block all cookies</li>
            <li>Accept only first-party cookies</li>
            <li>Delete cookies after each session</li>
            <li>Receive notifications when cookies are set</li>
          </ul>
          <p className="mt-3 text-sm italic">Note: Blocking essential cookies may affect website functionality.</p>
        </section>

        <section>
          <h3 className="text-xl font-bold mb-3">5. Cookie Duration</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Session Cookies:</strong> Deleted when you close your browser</li>
            <li><strong>Persistent Cookies:</strong> Remain on your device for a set period or until manually deleted</li>
          </ul>
        </section>
      </div>
    )
  },

  security: {
    title: 'Security',
    content: (
      <div className="space-y-6">
        <p className="text-lg font-semibold">Your Security is Our Priority</p>
        
        <section>
          <h3 className="text-xl font-bold mb-3">1. Encryption & Data Protection</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>256-bit SSL Encryption:</strong> All data transmitted between your device and our servers is encrypted using military-grade encryption</li>
            <li><strong>End-to-End Encryption:</strong> Sensitive information is encrypted at rest and in transit</li>
            <li><strong>Secure Data Centers:</strong> Your data is stored in SOC 2 compliant, geographically distributed data centers</li>
            <li><strong>Regular Security Audits:</strong> Third-party penetration testing and vulnerability assessments</li>
          </ul>
        </section>

        <section>
          <h3 className="text-xl font-bold mb-3">2. Authentication & Access Control</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Two-Factor Authentication (2FA):</strong> Required for all account access</li>
            <li><strong>Biometric Login:</strong> Support for fingerprint and facial recognition</li>
            <li><strong>Security Questions:</strong> Additional verification layer for sensitive operations</li>
            <li><strong>Device Recognition:</strong> Alerts for logins from new devices or locations</li>
            <li><strong>Session Management:</strong> Automatic logout after inactivity</li>
          </ul>
        </section>

        <section>
          <h3 className="text-xl font-bold mb-3">3. Fraud Prevention</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>24/7 Monitoring:</strong> Real-time transaction monitoring for suspicious activity</li>
            <li><strong>AI-Powered Detection:</strong> Machine learning algorithms identify unusual patterns</li>
            <li><strong>Transaction Alerts:</strong> Instant notifications for all account activity</li>
            <li><strong>Spending Controls:</strong> Set limits and restrictions on your cards</li>
            <li><strong>Zero Liability Protection:</strong> You're not responsible for unauthorized transactions</li>
          </ul>
        </section>

        <section>
          <h3 className="text-xl font-bold mb-3">4. Regulatory Compliance</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>FDIC Insured:</strong> Deposits insured up to $250,000</li>
            <li><strong>PCI DSS Compliant:</strong> Payment Card Industry Data Security Standard certified</li>
            <li><strong>GDPR Compliant:</strong> European data protection regulations</li>
            <li><strong>SOC 2 Type II:</strong> Audited for security, availability, and confidentiality</li>
          </ul>
        </section>

        <section>
          <h3 className="text-xl font-bold mb-3">5. Best Practices for Account Security</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>Use a strong, unique password (minimum 12 characters)</li>
            <li>Enable two-factor authentication</li>
            <li>Never share your password or security codes</li>
            <li>Verify emails claiming to be from Rosch Capital Bank</li>
            <li>Use secure networks (avoid public Wi-Fi for banking)</li>
            <li>Keep your contact information up to date</li>
            <li>Review your account activity regularly</li>
          </ul>
        </section>

        <section>
          <h3 className="text-xl font-bold mb-3">6. Report Security Concerns</h3>
          <p>If you suspect unauthorized access or fraudulent activity:</p>
          <p className="mt-2"><strong>24/7 Security Hotline:</strong> +1 (234) 567-891</p>
          <p><strong>Email:</strong> security@roschcapital.com</p>
          <p className="mt-3 text-sm italic">We respond to security incidents within 1 hour.</p>
        </section>
      </div>
    )
  },

  accessibility: {
    title: 'Accessibility',
    content: (
      <div className="space-y-6">
        <p className="text-lg font-semibold">Banking for Everyone</p>
        
        <section>
          <h3 className="text-xl font-bold mb-3">1. Our Commitment</h3>
          <p>Rosch Capital Bank is committed to ensuring digital accessibility for people with disabilities. We continuously improve the user experience for everyone and apply relevant accessibility standards.</p>
        </section>

        <section>
          <h3 className="text-xl font-bold mb-3">2. Accessibility Standards</h3>
          <p className="mb-2">Our website and mobile app conform to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>WCAG 2.1 Level AA:</strong> Web Content Accessibility Guidelines</li>
            <li><strong>Section 508:</strong> U.S. federal accessibility requirements</li>
            <li><strong>ADA Title III:</strong> Americans with Disabilities Act compliance</li>
          </ul>
        </section>

        <section>
          <h3 className="text-xl font-bold mb-3">3. Accessibility Features</h3>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-bold text-lg mb-2">Visual Accessibility</h4>
              <ul className="list-disc pl-6 space-y-1">
                <li>High contrast mode for better readability</li>
                <li>Adjustable font sizes</li>
                <li>Screen reader compatibility (JAWS, NVDA, VoiceOver)</li>
                <li>Alt text for all images and icons</li>
                <li>Color-blind friendly design</li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-lg mb-2">Motor Accessibility</h4>
              <ul className="list-disc pl-6 space-y-1">
                <li>Full keyboard navigation support</li>
                <li>Large, easy-to-click buttons and links</li>
                <li>Voice command support (mobile app)</li>
                <li>No time-sensitive actions required</li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-lg mb-2">Cognitive Accessibility</h4>
              <ul className="list-disc pl-6 space-y-1">
                <li>Clear, simple language</li>
                <li>Consistent navigation and layout</li>
                <li>Error prevention and clear error messages</li>
                <li>Helpful tooltips and guidance</li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-lg mb-2">Auditory Accessibility</h4>
              <ul className="list-disc pl-6 space-y-1">
                <li>Text alternatives for audio content</li>
                <li>Visual alerts and notifications</li>
                <li>Closed captions for video content</li>
              </ul>
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-xl font-bold mb-3">4. Assistive Technology Support</h3>
          <p className="mb-2">Our platform works with:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Screen readers (JAWS, NVDA, VoiceOver, TalkBack)</li>
            <li>Screen magnification software</li>
            <li>Speech recognition software</li>
            <li>Alternative input devices</li>
          </ul>
        </section>

        <section>
          <h3 className="text-xl font-bold mb-3">5. Customer Support</h3>
          <p className="mb-2">We offer accessible customer support through multiple channels:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>TTY/TDD:</strong> +1 (234) 567-892 (for hearing impaired)</li>
            <li><strong>Video Relay Service:</strong> Available 24/7</li>
            <li><strong>Live Chat:</strong> Screen reader compatible</li>
            <li><strong>Email:</strong> accessibility@roschcapital.com</li>
            <li><strong>Phone:</strong> +1 (234) 567-890</li>
          </ul>
        </section>

        <section>
          <h3 className="text-xl font-bold mb-3">6. Ongoing Improvements</h3>
          <p>We regularly test our platform with users who have disabilities and make continuous improvements. Our development team receives accessibility training and follows best practices.</p>
        </section>

        <section>
          <h3 className="text-xl font-bold mb-3">7. Feedback</h3>
          <p>We welcome feedback on the accessibility of Rosch Capital Bank. If you encounter any barriers, please contact us:</p>
          <p className="mt-2"><strong>Email:</strong> accessibility@roschcapital.com</p>
          <p><strong>Phone:</strong> +1 (234) 567-890</p>
          <p className="mt-3">We aim to respond within 2 business days.</p>
        </section>
      </div>
    )
  }
};
