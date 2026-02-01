const { query } = require('../config/database');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

class User {
  // Create a new user
  static async create({ email, password, fullName }) {
    const passwordHash = await bcrypt.hash(password, 10);
    const verificationToken = uuidv4();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const result = await query(
      `INSERT INTO users (email, password_hash, full_name, verification_token, verification_token_expires)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, full_name, email_verified_at, created_at`,
      [email, passwordHash, fullName, verificationToken, verificationExpires]
    );

    return {
      user: result.rows[0],
      verificationToken,
    };
  }

  // Find user by email
  static async findByEmail(email) {
    const result = await query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0];
  }

  // Find user by ID
  static async findById(id) {
    const result = await query(
      'SELECT id, email, full_name, avatar_url, provider, email_verified_at, created_at, updated_at FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  // Create OAuth user (Google, Apple, etc.)
  static async createOAuthUser({ email, fullName, avatarUrl, provider, providerId }) {
    const result = await query(
      `INSERT INTO users (email, full_name, avatar_url, provider, provider_id, email_verified_at)
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
       RETURNING id, email, full_name, avatar_url, provider, email_verified_at, created_at`,
      [email, fullName, avatarUrl, provider, providerId]
    );
    return result.rows[0];
  }

  // Find user by OAuth provider
  static async findByProvider(provider, providerId) {
    const result = await query(
      'SELECT id, email, full_name, avatar_url, provider, provider_id, email_verified_at, created_at FROM users WHERE provider = $1 AND provider_id = $2',
      [provider, providerId]
    );
    return result.rows[0];
  }

  // Find or create OAuth user
  static async findOrCreateOAuthUser({ email, fullName, avatarUrl, provider, providerId }) {
    // Try to find existing user by provider
    let user = await this.findByProvider(provider, providerId);

    if (user) {
      // Update last login
      await this.updateLastLogin(user.id);
      return user;
    }

    // Try to find by email (user might have signed up with email first)
    user = await this.findByEmail(email);

    if (user) {
      // Link OAuth provider to existing account
      await query(
        'UPDATE users SET provider = $1, provider_id = $2, avatar_url = $3, email_verified_at = CURRENT_TIMESTAMP WHERE id = $4',
        [provider, providerId, avatarUrl, user.id]
      );
      await this.updateLastLogin(user.id);
      return await this.findById(user.id);
    }

    // Create new OAuth user
    user = await this.createOAuthUser({ email, fullName, avatarUrl, provider, providerId });
    return user;
  }

  // Verify password
  static async verifyPassword(user, password) {
    return await bcrypt.compare(password, user.password_hash);
  }

  // Verify email
  static async verifyEmail(token) {
    const result = await query(
      `UPDATE users
       SET email_verified_at = CURRENT_TIMESTAMP,
           verification_token = NULL,
           verification_token_expires = NULL
       WHERE verification_token = $1
         AND verification_token_expires > CURRENT_TIMESTAMP
       RETURNING id, email, full_name, email_verified_at, created_at`,
      [token]
    );
    return result.rows[0];
  }

  // Generate new verification token
  static async generateVerificationToken(userId) {
    const verificationToken = uuidv4();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await query(
      `UPDATE users
       SET verification_token = $1, verification_token_expires = $2
       WHERE id = $3`,
      [verificationToken, verificationExpires, userId]
    );

    return verificationToken;
  }

  // Generate password reset token
  static async generateResetToken(email) {
    const resetToken = uuidv4();
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    const result = await query(
      `UPDATE users
       SET reset_token = $1, reset_token_expires = $2
       WHERE email = $3
       RETURNING id, email`,
      [resetToken, resetExpires, email]
    );

    return result.rows[0] ? resetToken : null;
  }

  // Reset password
  static async resetPassword(token, newPassword) {
    const passwordHash = await bcrypt.hash(newPassword, 10);

    const result = await query(
      `UPDATE users
       SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL
       WHERE reset_token = $2 AND reset_token_expires > CURRENT_TIMESTAMP
       RETURNING id, email`,
      [passwordHash, token]
    );

    return result.rows[0];
  }

  // Update password
  static async updatePassword(userId, newPassword) {
    const passwordHash = await bcrypt.hash(newPassword, 10);

    await query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [passwordHash, userId]
    );
  }

  // Update last login
  static async updateLastLogin(userId) {
    await query(
      'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1',
      [userId]
    );
  }

  // Get all users (admin)
  static async findAll(limit = 50, offset = 0) {
    const result = await query(
      `SELECT id, email, full_name, email_verified_at, created_at, last_login_at
       FROM users
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return result.rows;
  }

  // Get user count (admin)
  static async count() {
    const result = await query('SELECT COUNT(*) as count FROM users');
    return parseInt(result.rows[0].count);
  }

  // Delete user (admin)
  static async delete(userId) {
    await query('DELETE FROM users WHERE id = $1', [userId]);
  }
}

module.exports = User;
