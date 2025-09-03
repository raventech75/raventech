// app/page.tsx
import { redirect } from 'next/navigation';

export default function Page() {
  redirect('/sign-in'); // redirection immédiate côté serveur
}