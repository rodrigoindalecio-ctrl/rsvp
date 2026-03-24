import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://cuxychxmsmvkxaeyccbl.supabase.co'
const supabaseAnonKey = 'sb_publishable_b8EUNsZ1mRcTRwe6ljHqkA_Civc-HeM'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testUpdate() {
  const { data: events, error: fetchError } = await supabase.from('events').select('id, slug, event_settings, gift_list_enabled').limit(1)
  if (fetchError) {
    console.error('Fetch Error:', fetchError)
    return
  }
  console.log('Got events:', events)
  
  if (events && events.length > 0) {
    const event = events[0]
    const id = event.id
    console.log('Attempting to update event', id)
    
    // Attempt update
    const { data: updateData, error: updateError } = await supabase
      .from('events')
      .update({ gift_list_enabled: !event.gift_list_enabled })
      .eq('id', id)
      .select()
      
    if (updateError) {
      console.error('Update Error:', updateError)
    } else {
      console.log('Update Success:', updateData)
    }
  }
}

testUpdate()
