const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

let client = null;

function getSupabase() {
  if (!client) {
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('请配置 SUPABASE_URL 和 SUPABASE_SERVICE_KEY');
    }
    client = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });
  }
  return client;
}

module.exports = { getSupabase };
