import bcrypt from 'bcryptjs';

// Generate password hash for default admin
const password = 'Admin123!@#';
const hash = await bcrypt.hash(password, 10);

console.log('='.repeat(60));
console.log('DEFAULT SUPER ADMIN CREDENTIALS');
console.log('='.repeat(60));
console.log('Email:', 'admin@bidroom.com');
console.log('Password:', password);
console.log('Password Hash:', hash);
console.log('='.repeat(60));
console.log('\nRun this SQL in Supabase:');
console.log('='.repeat(60));
console.log(`
INSERT INTO admin_users (
  email,
  password_hash,
  role,
  first_name,
  last_name,
  two_factor_enabled,
  is_active
) VALUES (
  'admin@bidroom.com',
  '${hash}',
  'super_admin',
  'Super',
  'Admin',
  false,
  true
) ON CONFLICT (email) DO NOTHING;
`);
console.log('='.repeat(60));
