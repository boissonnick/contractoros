import { redirect } from 'next/navigation';

export default function Page() {
  // Simple redirect for the alpha. 
  // In a real app, this might be a marketing landing page.
  redirect('/login');
}