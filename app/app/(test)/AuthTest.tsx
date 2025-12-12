import { supabase } from '../../lib/supabaseClient';
import { useEffect } from 'react';

export default function AuthTest() {
  useEffect(() => {
    const testConnection = async () => {
      const { data, error } = await supabase.from('users').select('*').limit(1);
      if (error) console.log('❌ Supabase error:', error);
      else console.log('✅ Supabase connected:', data);
    };
    testConnection();
  }, []);

  return null;
}

