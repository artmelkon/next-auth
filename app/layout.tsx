export const metadata = {
  title: "Next.js Auth App",
  description:
    "A Next.js application with authentication using JWT and MongoDB",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
