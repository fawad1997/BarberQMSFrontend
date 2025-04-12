import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | WalkInOnline",
  description: "Terms of Service for WalkInOnline Barbershop Queue Management System"
};

export default function TermsOfServicePage() {
  return (
    <div className="container max-w-4xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>
      
      <p className="mb-4 text-muted-foreground">Last Updated: {new Date().toLocaleDateString()}</p>
      
      <div className="prose dark:prose-invert">
        <h2 className="text-2xl font-semibold mt-8 mb-4">1. Acceptance of Terms</h2>
        <p>
          By accessing or using the WalkInOnline service ("Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, you should not use our Service.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">2. Description of Service</h2>
        <p>
          WalkInOnline is a queue management and appointment booking platform for barbershops. We provide real-time queue updates, appointment scheduling, and related services to connect customers with barbershops.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">3. User Accounts</h2>
        <p>
          To use certain features of our Service, you may need to create an account. You are responsible for:
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li>Providing accurate and complete information</li>
          <li>Maintaining the security of your account credentials</li>
          <li>All activities that occur under your account</li>
        </ul>
        <p>
          We offer authentication through third-party services (Google, Facebook, Microsoft). When using these services, you are also subject to their terms and policies.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">4. User Conduct</h2>
        <p>
          When using our Service, you agree not to:
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li>Violate any applicable laws or regulations</li>
          <li>Infringe on the rights of others</li>
          <li>Submit false or misleading information</li>
          <li>Interfere with the proper operation of the Service</li>
          <li>Attempt to bypass any security measures</li>
          <li>Use the Service for any unauthorized or illegal purpose</li>
        </ul>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">5. Appointments and Bookings</h2>
        <p>
          Our Service facilitates appointments between customers and barbershops. Please note:
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li>Appointment availability is subject to barbershop schedules</li>
          <li>Cancellation policies are set by individual barbershops</li>
          <li>We are not responsible for the quality of services provided by barbershops</li>
          <li>Estimated wait times are approximate and subject to change</li>
        </ul>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">6. Intellectual Property</h2>
        <p>
          All content and functionality on our Service, including but not limited to text, graphics, logos, and software, is the property of WalkInOnline or our licensors and is protected by copyright and other intellectual property laws.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">7. Disclaimer of Warranties</h2>
        <p>
          OUR SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT ANY WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED OR ERROR-FREE.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">8. Limitation of Liability</h2>
        <p>
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, WALKINONLINE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">9. Indemnification</h2>
        <p>
          You agree to indemnify and hold harmless WalkInOnline and its officers, directors, employees, and agents from any claims, damages, losses, liabilities, and expenses arising out of your use of the Service or violation of these Terms.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">10. Modifications to the Service</h2>
        <p>
          We reserve the right to modify or discontinue the Service at any time without notice. We shall not be liable to you or any third party for any modification, suspension, or discontinuance of the Service.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">11. Changes to Terms</h2>
        <p>
          We may update these Terms of Service from time to time. We will notify you of any changes by posting the new Terms on this page. Your continued use of the Service after such changes constitutes your acceptance of the new Terms.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">12. Governing Law</h2>
        <p>
          These Terms shall be governed by and construed in accordance with the laws of [Your Country/State], without regard to its conflict of law provisions.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">13. Contact Information</h2>
        <p>
          If you have any questions about these Terms, please contact us at:
        </p>
        <p className="mb-8">
          <strong>Email:</strong> legal@walkinonline.com<br />
          <strong>Address:</strong> WalkInOnline Inc., 123 Main Street, City, Country
        </p>
      </div>
    </div>
  );
} 