import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Legal Information | WalkInOnline",
  description: "Legal information, policies, and terms for WalkInOnline"
};

export default function LegalHubPage() {
  return (
    <div className="container max-w-4xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-8">Legal Information</h1>
      
      <p className="text-lg mb-8">
        Welcome to the WalkInOnline legal hub. Here you can find all our policies, terms, and legal information.
      </p>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Link 
          href="/legal/privacy-policy"
          className="block p-6 border rounded-lg hover:border-primary hover:bg-primary/5 transition-colors"
        >
          <h2 className="text-xl font-semibold mb-2">Privacy Policy</h2>
          <p className="text-muted-foreground">
            Learn how we collect, use, and protect your personal information.
          </p>
        </Link>
        
        <Link 
          href="/legal/terms-of-service"
          className="block p-6 border rounded-lg hover:border-primary hover:bg-primary/5 transition-colors"
        >
          <h2 className="text-xl font-semibold mb-2">Terms of Service</h2>
          <p className="text-muted-foreground">
            Understand the rules and regulations for using our services.
          </p>
        </Link>
        
        <Link 
          href="/legal/data-deletion"
          className="block p-6 border rounded-lg hover:border-primary hover:bg-primary/5 transition-colors"
        >
          <h2 className="text-xl font-semibold mb-2">Data Deletion</h2>
          <p className="text-muted-foreground">
            Instructions on how to delete your data from our systems.
          </p>
        </Link>
      </div>
      
      <div className="mt-12 pt-8 border-t">
        <h2 className="text-2xl font-semibold mb-4">Contact Our Legal Team</h2>
        <p className="mb-4">
          If you have any questions about our legal policies or need assistance, please contact us:
        </p>
        <p>
          <strong>Email:</strong> legal@walkinonline.com<br />
          <strong>Address:</strong> WalkInOnline Inc., 123 Main Street, City, Country<br />
          <strong>Phone:</strong> +1-234-567-8900
        </p>
      </div>
    </div>
  );
} 