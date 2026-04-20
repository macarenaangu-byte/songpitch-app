import { DESIGN_SYSTEM } from '../constants/designSystem';
import { LegalPageLayout } from './TermsOfServicePage';

export function PrivacyPolicyPage({ onBack }) {
  const h2Style = { fontSize: 22, fontWeight: 600, color: DESIGN_SYSTEM.colors.text.primary, marginTop: 36, marginBottom: 12 };
  const h3Style = { fontSize: 17, fontWeight: 600, color: DESIGN_SYSTEM.colors.text.primary, marginTop: 24, marginBottom: 8 };
  return (
    <LegalPageLayout title="Privacy Policy" onBack={onBack}>
      <p>Coda-Vault ("we", "us", "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our platform at songpitchhub.com.</p>

      <h2 style={h2Style}>1. Information We Collect</h2>
      <h3 style={h3Style}>1.1 Account Information</h3>
      <p>When you create an account, we collect your name, email address, account type (Composer or Music Executive), and optional profile details such as your company name, job title, genres, instruments, and PRO affiliation.</p>
      <h3 style={h3Style}>1.2 Content You Upload</h3>
      <p>We store music files, audio recordings, song metadata (title, genre, mood, lyrics), and profile images that you upload to the Platform.</p>
      <h3 style={h3Style}>1.3 Usage Data</h3>
      <p>We automatically collect information about how you interact with the Platform, including pages visited, features used, profile views, and opportunity interactions.</p>
      <h3 style={h3Style}>1.4 AI Analysis Data</h3>
      <p>When you upload audio files, our machine learning system analyzes them to detect genre, mood, and transcribe lyrics. These analysis results are stored alongside your song metadata.</p>

      <h2 style={h2Style}>2. How We Use Your Information</h2>
      <ul style={{ paddingLeft: 24, marginTop: 8 }}>
        <li>To operate and maintain your account and the Platform</li>
        <li>To enable discovery between Composers and Music Executives</li>
        <li>To provide AI-powered audio analysis and metadata generation</li>
        <li>To deliver in-app messaging and notifications</li>
        <li>To improve our services and develop new features</li>
        <li>To communicate important updates about the Platform or your account</li>
      </ul>

      <h2 style={h2Style}>3. Data Storage & Security</h2>
      <p>Your data is stored securely using Supabase, which provides encrypted data storage and secure authentication. Audio files are stored in cloud storage buckets with access controls. We implement row-level security policies to ensure users can only access data they are authorized to view.</p>

      <h2 style={h2Style}>4. Data Sharing</h2>
      <h3 style={h3Style}>4.1 Public Profile Information</h3>
      <p>Your profile name, account type, genres, and profile image are visible to other authenticated Users for the purpose of discovery and collaboration.</p>
      <h3 style={h3Style}>4.2 Song Data</h3>
      <p>Songs you upload are visible in the Platform catalog to authenticated Users. You control what you upload and can delete your songs at any time.</p>
      <h3 style={h3Style}>4.3 Third-Party Services</h3>
      <p>We use the following third-party services to operate the Platform:</p>
      <ul style={{ paddingLeft: 24, marginTop: 8 }}>
        <li><strong>Supabase</strong> — Authentication, database, and file storage</li>
        <li><strong>OpenAI</strong> — AI Brief Writer for generating opportunity descriptions</li>
        <li><strong>TensorFlow / YAMNet</strong> — Audio analysis for genre and mood classification (runs on our servers, not sent to third parties)</li>
      </ul>
      <p style={{ marginTop: 8 }}>We do not sell your personal information to third parties.</p>

      <h2 style={h2Style}>5. Your Rights</h2>
      <h3 style={h3Style}>5.1 Access & Correction</h3>
      <p>You can view and edit your profile information at any time through your account settings.</p>
      <h3 style={h3Style}>5.2 Deletion</h3>
      <p>You can delete your account and associated data through your profile settings. Upon deletion, your profile is soft-deleted and your data is retained for up to 30 days before permanent removal.</p>
      <h3 style={h3Style}>5.3 Data Export</h3>
      <p>You may request a copy of your personal data by contacting us at the email address below.</p>

      <h2 style={h2Style}>6. Cookies & Tracking</h2>
      <p>The Platform uses essential cookies for authentication and session management. We do not currently use third-party advertising or analytics cookies. If this changes, we will update this policy and provide appropriate notice and consent mechanisms.</p>

      <h2 style={h2Style}>7. Children's Privacy</h2>
      <p>The Platform is not intended for users under the age of 18. We do not knowingly collect information from children. If you believe a child has created an account, please contact us immediately.</p>

      <h2 style={h2Style}>8. International Users</h2>
      <p>If you are accessing the Platform from outside the United States, please be aware that your data may be transferred to and processed in the United States. By using the Platform, you consent to this transfer.</p>

      <h2 style={h2Style}>9. Changes to This Policy</h2>
      <p>We may update this Privacy Policy from time to time. We will notify registered Users of material changes via email or in-app notification. The "Last updated" date at the top reflects the most recent revision.</p>

      <h2 style={h2Style}>10. Contact</h2>
      <p>For privacy-related questions or data requests, contact us at <a href="mailto:mangulo@songpitchhub.com" style={{ color: DESIGN_SYSTEM.colors.brand.accent }}>mangulo@songpitchhub.com</a>.</p>
    </LegalPageLayout>
  );
}
