import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://cuxychxmsmvkxaeyccbl.supabase.co'
const supabaseAnonKey = 'sb_publishable_b8EUNsZ1mRcTRwe6ljHqkA_Civc-HeM'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testFetch() {
  const { data: events, error: fetchError } = await supabase.from('events').select('id, slug, event_settings, gift_list_enabled')
  if (fetchError) {
    console.error('Fetch Error:', fetchError)
    return
  }
  
  for (const event of events) {
    console.log(`Event: ${event.id} - ${event.slug}`)
    console.log(`gift_list_enabled: ${event.gift_list_enabled}`)
    console.log(`isGiftListEnabled (settings): ${event.event_settings?.isGiftListEnabled}`)
    console.log('---')
  }
}

testFetch()
