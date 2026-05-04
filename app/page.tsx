import { redirect } from 'next/navigation'

export default function Home() {
  // Authenticated users are caught by the middleware before reaching here.
  redirect('/login')
}
