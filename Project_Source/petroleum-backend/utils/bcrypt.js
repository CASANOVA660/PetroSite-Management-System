const crypto = require('crypto');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');

dotenv.config();

// Fixed key and IV lengths for AES-256-CBC
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-256-bit-key-here-32-characters'; // 32 bytes for AES-256
const ENCRYPTION_IV = process.env.ENCRYPTION_IV || 'your-iv-16-chars'; // 16 bytes for AES

const key = Buffer.from(ENCRYPTION_KEY, 'utf8');
const iv = Buffer.from(ENCRYPTION_IV, 'utf8');
const algorithm = 'aes-256-cbc';

const encryptAES = (text) => {
  try {
    // Ensure IV is exactly 16 bytes
    const ivBuffer = Buffer.alloc(16);
    iv.copy(ivBuffer);

    // Ensure key is exactly 32 bytes
    const keyBuffer = Buffer.alloc(32);
    key.copy(keyBuffer);

    const cipher = crypto.createCipheriv(algorithm, keyBuffer, ivBuffer);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return {
      iv: ivBuffer.toString('hex'),
      encryptedData: encrypted
    };
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Encryption failed');
  }
};

const decryptAES = (encrypted) => {
  try {
    // Ensure IV is exactly 16 bytes
    const ivBuffer = Buffer.alloc(16);
    Buffer.from(encrypted.iv, 'hex').copy(ivBuffer);

    // Ensure key is exactly 32 bytes
    const keyBuffer = Buffer.alloc(32);
    key.copy(keyBuffer);

    const decipher = crypto.createDecipheriv(algorithm, keyBuffer, ivBuffer);
    let decrypted = decipher.update(encrypted.encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Decryption failed');
  }
};

const hashPassword = async (password) => {
  try {
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);
    return encryptAES(hashed);
  } catch (error) {
    console.error('Hash password error:', error);
    throw new Error('Password hashing failed');
  }
};

const comparePassword = async (password, encrypted) => {
  try {
    const hashed = decryptAES(encrypted);
    return await bcrypt.compare(password, hashed);
  } catch (error) {
    console.error('Compare password error:', error);
    throw new Error('Password comparison failed');
  }
};

module.exports = { hashPassword, comparePassword };