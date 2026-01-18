import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://cbhholyiuylnerjzppjc.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNiaGhvbHlpdXlsbmVyanpwcGpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3MjE0MTgsImV4cCI6MjA4NDI5NzQxOH0.1tK0NDxge9zf9ZtDsmvFHEp-7mWYOViPVx7SXQqkJDM'

export const supabase = createClient(supabaseUrl, supabaseKey)