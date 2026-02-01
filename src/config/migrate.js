const { pool } = require('./database');

const createTables = async () => {
  try {
    console.log('Starting database migration...');

    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255),
        full_name VARCHAR(255),
        avatar_url TEXT,
        provider VARCHAR(50) DEFAULT 'email',
        provider_id VARCHAR(255),
        email_verified_at TIMESTAMP,
        verification_token VARCHAR(255),
        verification_token_expires TIMESTAMP,
        reset_token VARCHAR(255),
        reset_token_expires TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login_at TIMESTAMP,
        UNIQUE(provider, provider_id)
      );
    `);
    console.log('✓ Users table created/verified');

    // Create refresh_tokens table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(500) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        revoked_at TIMESTAMP
      );
    `);
    console.log('✓ Refresh tokens table created/verified');

    // Create files table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS files (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        file_name VARCHAR(500) NOT NULL,
        file_size BIGINT NOT NULL,
        file_type VARCHAR(100),
        mime_type VARCHAR(100),
        r2_key VARCHAR(500) NOT NULL,
        r2_url TEXT NOT NULL,
        thumbnail_url TEXT,
        is_public BOOLEAN DEFAULT FALSE,
        share_token VARCHAR(255),
        share_expires_at TIMESTAMP,
        download_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Files table created/verified');

    // Create folders table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS folders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        parent_folder_id UUID REFERENCES folders(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, name, parent_folder_id)
      );
    `);
    console.log('✓ Folders table created/verified');

    // Create admin_users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'admin',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login_at TIMESTAMP
      );
    `);
    console.log('✓ Admin users table created/verified');

    // Create indexes for performance
    await pool.query('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_users_provider_id ON users(provider, provider_id);');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_files_user_id ON files(user_id);');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_folders_user_id ON folders(user_id);');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_files_share_token ON files(share_token);');
    console.log('✓ Indexes created/verified');

    // Create default admin user if not exists
    const bcrypt = require('bcryptjs');
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@loxplayer.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const adminPasswordHash = await bcrypt.hash(adminPassword, 10);

    await pool.query(`
      INSERT INTO admin_users (email, password_hash, name, role)
      VALUES ($1, $2, 'System Admin', 'super_admin')
      ON CONFLICT (email) DO NOTHING;
    `, [adminEmail, adminPasswordHash]);
    console.log('✓ Default admin user created/verified');

    console.log('\n✅ Database migration completed successfully!');
    console.log(`\n📧 Admin Login: ${adminEmail}`);
    console.log(`🔑 Admin Password: ${adminPassword}\n`);
    console.log('⚠️  Please change the admin password after first login!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

createTables();
