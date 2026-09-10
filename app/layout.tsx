import type { Metadata } from 'next';
import './globals.css';
import './game.css';


export const metadata: Metadata = {
  title: 'The White House · Free Roam',
  description: 'Play as Donald Trump in an unofficial low-poly White House exploration game. Walk the grounds, explore the residence and meet the staff.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className="antialiased"
      >
        {children}
      </body>
    </html>
  );
}
