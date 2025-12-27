const speakeasy = require('speakeasy');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkDrift() {
    const email = 'sub@bidroom.com';
    const { data: user, error } = await supabase
        .from('users')
        .select('two_factor_secret, email')
        .eq('email', email)
        .single();

    if (error || !user) {
        console.error('User not found:', error);
        return;
    }

    const secret = user.two_factor_secret;
    console.log(`Email: ${user.email}`);
    console.log(`Secret: ${secret}`);

    const token = speakeasy.totp({
        secret: secret,
        encoding: 'base32'
    });

    console.log(`Current Code on Server: ${token}`);
    console.log(`Server Time (ISO): ${new Date().toISOString()}`);
    console.log(`Server Time (Unix): ${Math.floor(Date.now() / 1000)}`);

    // Check codes for +/- 10 steps
    console.log('\nValid Codes in current window (+/- 10 steps):');
    for (let i = -10; i <= 10; i++) {
        const t = speakeasy.totp({
            secret: secret,
            encoding: 'base32',
            time: Math.floor(Date.now() / 1000) + (i * 30)
        });
        console.log(`${i >= 0 ? '+' : ''}${i}: ${t}`);
    }
}

checkDrift();
