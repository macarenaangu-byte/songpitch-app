import { LegalPageLayout } from './TermsOfServicePage';
import { DESIGN_SYSTEM } from '../constants/designSystem';

export function DMCAPage({ onBack }) {
  const h2Style = { fontSize: 22, fontWeight: 600, color: DESIGN_SYSTEM.colors.text.primary, marginTop: 36, marginBottom: 12 };
  const h3Style = { fontSize: 17, fontWeight: 600, color: DESIGN_SYSTEM.colors.text.primary, marginTop: 24, marginBottom: 8 };
  return (
    <LegalPageLayout title="DMCA & Copyright Policy" onBack={onBack}>
      <p>SongPitch respects the intellectual property rights of others and expects its users to do the same. In accordance with the Digital Millennium Copyright Act (DMCA), we will respond promptly to claims of copyright infringement committed using our platform.</p>

      <h2 style={h2Style}>1. Copyright Infringement Claims</h2>
      <p>If you believe that content hosted on SongPitch infringes your copyright, please submit a written notice containing the following information:</p>
      <ul style={{ paddingLeft: 24, marginTop: 12 }}>
        <li>A physical or electronic signature of the copyright owner or authorized agent.</li>
        <li>Identification of the copyrighted work claimed to have been infringed.</li>
        <li>Identification of the material on SongPitch that is claimed to be infringing, with enough detail to locate it.</li>
        <li>Your contact information (name, address, telephone number, email).</li>
        <li>A statement that you have a good faith belief that use of the material is not authorized by the copyright owner.</li>
        <li>A statement, under penalty of perjury, that the information in the notification is accurate and that you are authorized to act on behalf of the copyright owner.</li>
      </ul>

      <h2 style={h2Style}>2. Where to Send Notices</h2>
      <p>Please send DMCA takedown notices to:</p>
      <p style={{ background: 'rgba(255,255,255,0.05)', padding: '16px 20px', borderRadius: 8, margin: '12px 0', border: '1px solid rgba(255,255,255,0.1)' }}>
        <strong>SongPitch DMCA Agent</strong><br />
        Email: dmca@songpitchhub.com<br />
        Subject line: DMCA Takedown Request
      </p>

      <h2 style={h2Style}>3. Response Process</h2>
      <p>Upon receipt of a valid DMCA notice, SongPitch will:</p>
      <ul style={{ paddingLeft: 24, marginTop: 12 }}>
        <li>Remove or disable access to the allegedly infringing material promptly.</li>
        <li>Notify the user who uploaded the material of the takedown.</li>
        <li>Provide the uploader an opportunity to submit a counter-notification.</li>
      </ul>

      <h2 style={h2Style}>4. Counter-Notification</h2>
      <p>If you believe your content was removed in error, you may submit a counter-notification containing:</p>
      <ul style={{ paddingLeft: 24, marginTop: 12 }}>
        <li>Your physical or electronic signature.</li>
        <li>Identification of the material that was removed and its location before removal.</li>
        <li>A statement under penalty of perjury that you have a good faith belief the material was removed by mistake.</li>
        <li>Your name, address, and phone number, and consent to jurisdiction of your local federal court.</li>
      </ul>

      <h2 style={h2Style}>5. Repeat Infringers</h2>
      <p>SongPitch will terminate accounts of users who are determined to be repeat infringers. We maintain a policy of terminating access for users who repeatedly upload copyrighted content without authorization.</p>

      <h3 style={h3Style}>Rights Verification</h3>
      <p>SongPitch provides tools for composers to verify and document their rights ownership through our split sheet system. We encourage all users to maintain proper documentation of their music rights.</p>

      <h2 style={h2Style}>6. Good Faith</h2>
      <p>Please note that under Section 512(f) of the DMCA, any person who knowingly misrepresents that material is infringing may be subject to liability. Please ensure your claim is legitimate before submitting a notice.</p>
    </LegalPageLayout>
  );
}
