import type { Metadata } from "next";
import "./globals.css";
import { Theme } from '@radix-ui/themes';

export const metadata: Metadata = {
  title: "Kinetic Typography",
  description: "Generated by igor boechat",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
      <Theme>
        {children}
      </Theme>
      </body>
    </html>
  );
}
