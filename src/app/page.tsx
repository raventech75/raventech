import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import EditorLayout from '@/components/EditorLayout';
import { Analytics } from "@vercel/analytics/next"

export default function Home() {
  redirect('/pages'); // renvoie toujours vers la page /pages
}