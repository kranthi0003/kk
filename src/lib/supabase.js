import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://urfmdrhuagbgvghjolvf.supabase.co',
  'sb_publishable_GB-5ytPAF6UkOuLpOaCHPw_6p3GrwSz'
)

export default supabase
