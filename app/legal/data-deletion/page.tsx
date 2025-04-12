import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Data Deletion Instructions | WalkInOnline",
  description: "Learn how to delete your data from WalkInOnline"
};

export default function DataDeletionPage() {
  return (
    <div className="container max-w-4xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-8">Data Deletion Instructions</h1>
      
      <p className="mb-4 text-muted-foreground">Last Updated: {new Date().toLocaleDateString()}</p>
      
      <div className="prose dark:prose-invert">
        <h2 className="text-2xl font-semibold mt-8 mb-4">How to Delete Your Data</h2>
        <p>
          At WalkInOnline, we respect your right to control your personal data. If you wish to delete your data from our systems, you can follow the instructions below.
        </p>
        
        <h3 className="text-xl font-semibold mt-6 mb-3">Option 1: Delete Your Account Through the App</h3>
        <ol className="list-decimal pl-6 mb-4">
          <li className="mb-2">Log in to your WalkInOnline account</li>
          <li className="mb-2">Navigate to Account Settings (found in the profile section)</li>
          <li className="mb-2">Scroll to the bottom and select "Delete Account"</li>
          <li className="mb-2">Follow the prompts to confirm account deletion</li>
          <li className="mb-2">You will receive a confirmation email once the process is complete</li>
        </ol>
        
        <h3 className="text-xl font-semibold mt-6 mb-3">Option 2: Email Request</h3>
        <p>
          If you're unable to access your account or prefer to request deletion via email, please send a request to <strong>privacy@walkinonline.com</strong> with the following information:
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li>Subject line: "Data Deletion Request"</li>
          <li>Your full name</li>
          <li>The email address associated with your account</li>
          <li>A statement requesting account deletion</li>
        </ul>
        <p>
          Our team will process your request within 30 days and send a confirmation email once completed.
        </p>
        
        <h3 className="text-xl font-semibold mt-6 mb-3">Option 3: Facebook Login Users</h3>
        <p>
          If you created your account using Facebook Login, you can:
        </p>
        <ol className="list-decimal pl-6 mb-4">
          <li className="mb-2">
            Delete your WalkInOnline account using Option 1 or 2 above
          </li>
          <li className="mb-2">
            Additionally, you can remove app permissions in Facebook:
            <ul className="list-disc pl-6 mt-2">
              <li>Go to Facebook Settings & Privacy → Settings</li>
              <li>Select "Apps and Websites" on the left sidebar</li>
              <li>Find WalkInOnline in the list</li>
              <li>Click "Remove" to revoke access</li>
            </ul>
          </li>
        </ol>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">What We Delete</h2>
        <p>
          When you request data deletion, we will delete:
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li>Your user account profile information</li>
          <li>Your appointment history</li>
          <li>Your preferences and settings</li>
          <li>Any feedback or reviews you've submitted</li>
          <li>All personal identifiers and contact information</li>
        </ul>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">Data Retention</h2>
        <p>
          Some information may be retained:
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li>
            <strong>Legal Requirements:</strong> Information we are legally required to keep for compliance with applicable laws
          </li>
          <li>
            <strong>Aggregate Analytics:</strong> De-identified, aggregated data that cannot be linked back to you
          </li>
          <li>
            <strong>Backup Systems:</strong> Your data may persist in encrypted backup systems for up to 90 days before being automatically purged
          </li>
        </ul>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">Contact Us</h2>
        <p>
          If you have any questions about data deletion or encounter any issues with the deletion process, please contact our Privacy Team:
        </p>
        <p className="mb-8">
          <strong>Email:</strong> privacy@walkinonline.com<br />
          <strong>Address:</strong> WalkInOnline Inc., 123 Main Street, City, Country
        </p>
      </div>
    </div>
  );
} 