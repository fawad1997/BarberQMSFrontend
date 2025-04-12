import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | WalkInOnline",
  description: "Privacy Policy for WalkInOnline Barbershop Queue Management System"
};

export default function PrivacyPolicyPage() {
  return (
    <div className="container max-w-4xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
      
      <p className="mb-4 text-muted-foreground">Last Updated: {new Date().toLocaleDateString()}</p>
      
      <div className="prose dark:prose-invert">
        <h2 className="text-2xl font-semibold mt-8 mb-4">1. Introduction</h2>
        <p>
          WalkInOnline ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our barbershop queue management service.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">2. Information We Collect</h2>
        <p>
          We collect information when you create an account, log in, book appointments, or interact with our service. This information may include:
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li>Personal information (name, email address, phone number)</li>
          <li>Account credentials</li>
          <li>Appointment and booking information</li>
          <li>Profile pictures (when provided through your OAuth provider)</li>
          <li>Service preferences</li>
          <li>Feedback and reviews</li>
        </ul>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">3. How We Use Your Information</h2>
        <p>
          We use your information to:
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li>Create and manage your account</li>
          <li>Process and manage appointments</li>
          <li>Provide real-time queue estimates</li>
          <li>Improve our services</li>
          <li>Send notifications about appointments</li>
          <li>Respond to your inquiries</li>
        </ul>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">4. Third-Party Authentication Services</h2>
        <p>
          We offer single sign-on (SSO) authentication through third-party services such as Google, Facebook, and Microsoft. When you use these services to access our platform:
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li>We receive information from these providers in accordance with their privacy policies and your privacy settings</li>
          <li>We only request the necessary information to create and authenticate your account (typically email, name, and profile picture)</li>
          <li>We do not receive or store your passwords for these services</li>
        </ul>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">5. Data Sharing and Disclosure</h2>
        <p>
          We do not sell your personal information. We may share your information in the following circumstances:
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li>With barbershops you choose to book appointments with</li>
          <li>With service providers who help us operate our platform</li>
          <li>To comply with legal obligations</li>
          <li>With your explicit consent</li>
        </ul>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">6. Data Security</h2>
        <p>
          We implement appropriate technical and organizational measures to protect your personal information. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">7. Your Rights</h2>
        <p>
          Depending on your location, you may have the right to:
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li>Access the personal information we hold about you</li>
          <li>Correct inaccurate information</li>
          <li>Delete your personal information</li>
          <li>Restrict or object to processing of your information</li>
          <li>Data portability</li>
        </ul>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">8. Data Retention</h2>
        <p>
          We retain your personal information for as long as necessary to provide our services and fulfill the purposes outlined in this policy, unless a longer retention period is required by law.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">9. Children's Privacy</h2>
        <p>
          Our services are not intended for individuals under the age of 16. We do not knowingly collect personal information from children.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">10. Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last Updated" date.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">11. Contact Us</h2>
        <p>
          If you have questions about this Privacy Policy, please contact us at:
        </p>
        <p className="mb-8">
          <strong>Email:</strong> privacy@walkinonline.com<br />
          <strong>Address:</strong> WalkInOnline Inc., 123 Main Street, City, Country
        </p>
      </div>
    </div>
  );
} 