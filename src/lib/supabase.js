import { createClient } from '@supabase/supabase-js'

// Exported so callers that need a raw request (for example a keepalive
// POST during pagehide, which supabase-js cannot express) use the same
// credentials rather than a second copy.
export const SUPABASE_URL = 'https://urfmdrhuagbgvghjolvf.supabase.co'
export const SUPABASE_KEY = 'sb_publishable_GB-5ytPAF6UkOuLpOaCHPw_6p3GrwSz'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

export default supabase
