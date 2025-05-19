import './globals.css'

export const metadata = {
  title: 'CareMates',
  description: 'Connect with your loved ones',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}