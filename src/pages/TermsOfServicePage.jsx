import { DESIGN_SYSTEM } from '../constants/designSystem';
import { ArrowLeft } from 'lucide-react';

export function LegalPageLayout({ title, onBack, children }) {
  return (
    <div style={{ minHeight: '100vh', background: DESIGN_SYSTEM.colors.bg.primary, fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", color: DESIGN_SYSTEM.colors.text.primary }}>
      <div style={{ padding: '24px 48px', display: 'flex', alignItems: 'center', gap: 16, borderBottom: `1px solid ${DESIGN_SYSTEM.colors.border.light}` }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: DESIGN_SYSTEM.colors.text.secondary, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, padding: 0 }}>
          <ArrowLeft size={16} /> Back
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="/songpitch-logo.png" alt="SongPitch" style={{ width: 32, height: 32, objectFit: 'contain' }} onError={e => e.target.style.display = 'none'} />
          <span style={{ fontWeight: 700, fontSize: 18, color: DESIGN_SYSTEM.colors.text.primary }}>SongPitch</span>
        </div>
      </div>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '48px 24px' }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8, color: DESIGN_SYSTEM.colors.text.primary }}>{title}</h1>
        <p style={{ color: DESIGN_SYSTEM.colors.text.muted, fontSize: 14, marginBottom: 40 }}>Last updated: March 2, 2026</p>
        <div style={{ color: DESIGN_SYSTEM.colors.text.secondary, fontSize: 15, lineHeight: 1.8 }}>{children}</div>
      </div>
    </div>
  );
}

export function TermsOfServicePage({ onBack }) {
  const h2Style = { fontSize: 22, fontWeight: 600, color: DESIGN_SYSTEM.colors.text.primary, marginTop: 36, marginBottom: 12 };
  const h3Style = { fontSize: 17, fontWeight: 600, color: DESIGN_SYSTEM.colors.text.primary, marginTop: 24, marginBottom: 8 };
  return (
    <LegalPageLayout title="Terms of Service" onBack={onBack}>
      <p>Welcome to SongPitch ("Platform", "we", "us", "our"). By accessing or using our platform at songpitchhub.com, you agree to be bound by these Terms of Service ("Terms"). If you do not agree, do not use the Platform.</p>

      <h2 style={h2Style}>1. Definitions</h2>
      <p><strong>"User"</strong> means any individual who creates an account on the Platform, including Composers and Music Executives.</p>
      <p><strong>"Composer"</strong> means a User who uploads, manages, or pitches original musical works through the Platform.</p>
      <p><strong>"Music Executive"</strong> means a User who posts opportunities, reviews submissions, or seeks musical works through the Platform.</p>
      <p><strong>"Content"</strong> means any music files, audio recordings, metadata, text, images, or other materials uploaded to or created on the Platform.</p>

      <h2 style={h2Style}>2. Account Registration</h2>
      <p>You must be at least 18 years old to create an account. You are responsible for maintaining the security of your login credentials and for all activity under your account. You agree to provide accurate information during registration and to update it as needed.</p>

      <h2 style={h2Style}>3. Use of the Platform</h2>
      <h3 style={h3Style}>3.1 Acceptable Use</h3>
      <p>You agree to use the Platform only for lawful purposes related to discovering, sharing, and licensing music. You will not use the Platform to upload malicious content, harass other users, or circumvent security measures.</p>
      <h3 style={h3Style}>3.2 Prohibited Conduct</h3>
      <ul style={{ paddingLeft: 24, marginTop: 8 }}>
        <li>Uploading content you do not own or have the right to distribute</li>
        <li>Creating multiple accounts to manipulate the Platform</li>
        <li>Scraping, reverse engineering, or automated data collection</li>
        <li>Misrepresenting your identity or professional credentials</li>
        <li>Using the Platform to distribute spam, malware, or unsolicited promotions</li>
      </ul>

      <h2 style={h2Style}>4. Intellectual Property & Content Ownership</h2>
      <h3 style={h3Style}>4.1 Your Content</h3>
      <p>You retain full ownership of all Content you upload to the Platform. By uploading Content, you grant SongPitch a limited, non-exclusive, royalty-free license to host, display, and transmit your Content solely for the purpose of operating the Platform and providing our services to you.</p>
      <h3 style={h3Style}>4.2 No Transfer of Rights</h3>
      <p>The Platform facilitates connections between Composers and Music Executives. SongPitch does not claim ownership of your music, and uploading a song does not transfer any rights to us or to other Users. Any licensing agreements between Users are separate from these Terms.</p>
      <h3 style={h3Style}>4.3 Platform Content</h3>
      <p>The SongPitch name, logo, design, and all platform-created materials are the property of SongPitch and may not be reproduced without permission.</p>

      <h2 style={h2Style}>5. AI-Powered Features</h2>
      <p>The Platform uses machine learning to analyze uploaded audio files for genre classification, mood detection, and lyrics transcription. These results are provided as assistive metadata and may not be fully accurate. We also offer an AI Brief Writer that generates opportunity descriptions. You are responsible for reviewing and editing all AI-generated content before publishing.</p>

      <h2 style={h2Style}>6. Privacy</h2>
      <p>Your use of the Platform is also governed by our Privacy Policy. By using SongPitch, you consent to the collection and use of your information as described therein.</p>

      <h2 style={h2Style}>7. Messaging & Communications</h2>
      <p>The Platform provides in-app messaging between Users. You agree to communicate respectfully and professionally. SongPitch reserves the right to review and remove messages that violate these Terms or our community guidelines.</p>

      <h2 style={h2Style}>8. Termination</h2>
      <p>We may suspend or terminate your account at any time for violation of these Terms. You may delete your account at any time through your profile settings. Upon termination, your Content may be retained for a reasonable period to resolve any pending disputes.</p>

      <h2 style={h2Style}>9. Disclaimers</h2>
      <p>The Platform is provided "as is" without warranties of any kind. We do not guarantee uninterrupted access, accuracy of AI analysis, or the quality of interactions between Users. SongPitch is not a party to any licensing agreements formed between Users.</p>

      <h2 style={h2Style}>10. Limitation of Liability</h2>
      <p>To the maximum extent permitted by law, SongPitch shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Platform, including but not limited to loss of revenue, data, or business opportunities.</p>

      <h2 style={h2Style}>11. Changes to These Terms</h2>
      <p>We may update these Terms from time to time. We will notify registered Users of material changes via email or in-app notification. Continued use of the Platform after changes constitutes acceptance of the updated Terms.</p>

      <h2 style={h2Style}>12. Governing Law</h2>
      <p>These Terms shall be governed by and construed in accordance with the laws of the State of California, United States, without regard to conflict of law provisions.</p>

      <h2 style={h2Style}>13. Contact</h2>
      <p>For questions about these Terms, contact us at <a href="mailto:mangulo@songpitchhub.com" style={{ color: DESIGN_SYSTEM.colors.brand.accent }}>mangulo@songpitchhub.com</a>.</p>
    </LegalPageLayout>
  );
}
