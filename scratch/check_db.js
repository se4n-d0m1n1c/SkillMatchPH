
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkTables() {
  const { data, error } = await supabase
    .from('programs')
    .select('*')
    .limit(1);
  
  if (error) {
    console.error('Error fetching programs:', error);
  } else {
    console.log('Programs sample:', data);
  }

  // Try to see if there's a universities table
  const { data: uniData, error: uniError } = await supabase
    .from('universities')
    .select('*')
    .limit(1);

  if (uniError) {
    console.log('Universities table might not exist or is inaccessible:', uniError.message);
  } else {
    console.log('Universities table exists!');
  }
}

checkTables();
