'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

// Check if user is admin
async function isAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return false
  
  const { data } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()
  
  return data?.role === 'admin'
}

// export async function confirmAvailabilitySlot(formData: FormData) {
//     if (!await isAdmin()){
//         return {success: null, error: 'Unauthorised'}
//     }

//     const supabase = await createClient()
//     const {data: {user}} = await supabase.auth.getUser();

//     const {data, error} = await supabase
//     .from('bookings')
    
// }