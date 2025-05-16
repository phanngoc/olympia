import type { Metadata } from 'next'
import './globals.css'
import { Montserrat } from 'next/font/google'

const montserrat = Montserrat({ 
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700', '800']
})

export const metadata: Metadata = {
  title: 'Olympia Quiz - Thử thách trí tuệ',
  description: 'Ứng dụng trò chơi câu đố với nhận diện giọng nói AI',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi" className="dark">
      <body className={montserrat.className}>{children}</body>
    </html>
  )
} 