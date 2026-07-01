import type { Metadata } from "next";
import "@shopify/polaris/build/esm/styles.css";
import "./globals.css";
import { PolarisProvider } from "@/components/polaris/PolarisProvider";
import { ClientAuthWrapper } from "@/components/auth/ClientAuthWrapper";

export const metadata: Metadata = {
  title: "AICOP - AI Collaboration & Operations Platform",
  description: "Conversation-first AI operations platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <PolarisProvider>
          <ClientAuthWrapper>{children}</ClientAuthWrapper>
        </PolarisProvider>
      </body>
    </html>
  );
}
