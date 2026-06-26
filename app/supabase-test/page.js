import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export default async function Page() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: profiles, error } = await supabase.from('profiles').select('*').limit(5);

  if (error) {
    return (
      <div className="p-8 max-w-xl mx-auto bg-red-500/15 border border-red-500/30 rounded-2xl text-center mt-20">
        <h1 className="text-lg font-bold text-red-500">Supabase Connection Error</h1>
        <p className="text-xs text-brand-text-muted mt-2">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-xl mx-auto flex flex-col gap-4 mt-20">
      <h1 className="text-xl font-bold text-glow-cyan text-white">Supabase SSR Connection Test</h1>
      <p className="text-xs text-brand-text-muted">Successfully connected to Supabase and queried the `profiles` table:</p>
      
      <ul className="flex flex-col gap-2 mt-2">
        {profiles?.map((profile) => (
          <li key={profile.id} className="p-3 rounded-xl bg-white/5 border border-white/5 text-xs flex justify-between items-center">
            <span className="font-semibold text-white">{profile.full_name || profile.email}</span>
            <span className="capitalize text-brand-cyan border border-brand-cyan/20 px-2 py-0.5 rounded-full text-[10px]">{profile.role}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
