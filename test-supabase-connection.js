/**
 * Test Supabase Connection
 * Run this script to verify your Supabase credentials are working
 */

const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('🔍 Testing Supabase Connection...\n')
console.log('📍 Supabase URL:', supabaseUrl)
console.log('🔑 Anon Key:', supabaseKey ? `${supabaseKey.substring(0, 20)}...` : 'NOT SET')
console.log('')

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ ERROR: Missing Supabase credentials!')
  console.error('Please check your .env.local file')
  process.exit(1)
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  try {
    console.log('🧪 Test 1: Testing basic connection...')
    
    // Test 1: Try to query window_templates table
    const { data: templates, error: templatesError } = await supabase
      .from('window_templates')
      .select('*')
      .limit(1)

    if (templatesError) {
      console.log('⚠️  Window templates table not found or not accessible')
      console.log('   This is expected if you haven\'t run the database schema yet')
      console.log('   Error:', templatesError.message)
    } else {
      console.log('✅ Successfully connected to window_templates table!')
      console.log(`   Found ${templates?.length || 0} template(s)`)
    }

    console.log('')
    console.log('🧪 Test 2: Testing authentication endpoint...')

    // Test 2: Try to get session (should return null if no user is logged in)
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.log('❌ Auth endpoint error:', sessionError.message)
    } else {
      console.log('✅ Auth endpoint is accessible!')
      console.log(`   Current session: ${session ? 'Active' : 'None (expected)'}`)
    }

    console.log('')
    console.log('🧪 Test 3: Testing database table list...')

    // Test 3: Try to query profiles table
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)

    if (profilesError) {
      if (profilesError.code === '42P01') {
        console.log('⚠️  Database tables not found!')
        console.log('   👉 You need to run the database schema:')
        console.log('      1. Go to Supabase Dashboard → SQL Editor')
        console.log('      2. Copy contents of supabase-schema.sql')
        console.log('      3. Paste and execute')
      } else {
        console.log('⚠️  Profiles table error:', profilesError.message)
      }
    } else {
      console.log('✅ Profiles table is accessible!')
    }

    console.log('')
    console.log('📊 Connection Summary:')
    console.log('════════════════════════════════════════')
    
    if (!templatesError && !sessionError) {
      console.log('✅ Supabase connection is WORKING!')
      console.log('✅ Credentials are VALID!')
      console.log('')
      if (profilesError) {
        console.log('⚠️  Next step: Run the database schema')
        console.log('   File: supabase-schema.sql')
        console.log('   Location: Supabase Dashboard → SQL Editor')
      } else {
        console.log('✅ Database schema is SET UP!')
        console.log('✅ System is READY TO USE!')
      }
    } else {
      console.log('❌ Connection issues detected')
      console.log('   Check your credentials in .env.local')
    }
    console.log('════════════════════════════════════════')

  } catch (error) {
    console.error('❌ Unexpected error:', error.message)
    console.error('')
    console.error('Troubleshooting:')
    console.error('1. Check your internet connection')
    console.error('2. Verify Supabase project is not paused')
    console.error('3. Confirm credentials are correct')
    console.error('4. Try regenerating anon key in Supabase Dashboard')
  }
}

// Run tests
testConnection()
  .then(() => {
    console.log('')
    console.log('🎉 Test complete!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Fatal error:', error)
    process.exit(1)
  })
