import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'

export default async function HomePage() {
  // Redirect to lobby if user is authenticated, otherwise to auth
  redirect('/lobby')
}