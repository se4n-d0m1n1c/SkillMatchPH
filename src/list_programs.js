
import { supabase } from './lib/supabase.js';

async function listPrograms() {
  const { data, error } = await supabase.from('programs').select('id, title');
  if (error) {
    console.error(error);
  } else {
    console.log(JSON.stringify(data, null, 2));
  }
}

listPrograms();
