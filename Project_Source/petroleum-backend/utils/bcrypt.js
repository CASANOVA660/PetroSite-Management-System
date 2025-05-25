const crypto = require('crypto');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');

dotenv.config();

// Fixed key and IV lengths for AES-256-CBC
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-256-bit-key-here-32-characters'; // 32 bytes for AES-256
const ENCRYPTION_IV = process.env.ENCRYPTION_IV || 'your-iv-16-chars'; // 16 bytes for AES

console.log('Encryption config loaded. Key length:', ENCRYPTION_KEY.length, 'IV length:', ENCRYPTION_IV.length);

const key = Buffer.from(ENCRYPTION_KEY, 'utf8');
const iv = Buffer.from(ENCRYPTION_IV, 'utf8');
const algorithm = 'aes-256-cbc';

const encryptAES = (text) => {
  try {
    if (!text) {
      console.error('Encryption error: No text provided');
      throw new Error('No text provided for encryption');
    }

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
    console.error('Encryption error:', error.message, error.stack);
    throw new Error(`Encryption failed: ${error.message}`);
  }
};

const decryptAES = (encrypted) => {
  try {
    if (!encrypted || !encrypted.iv || !encrypted.encryptedData) {
      console.error('Decryption error: Invalid encrypted data format', encrypted);
      throw new Error('Invalid encrypted data format');
    }

    // Ensure IV is exactly 16 bytes
    const ivBuffer = Buffer.alloc(16);
    Buffer.from(encrypted.iv, 'hex').copy(ivBuffer);

    // Ensure key is exactly 32 bytes
    const keyBuffer = Buffer.alloc(32);
    key.copy(keyBuffer);

    const decipher = crypto.createDecipheriv(algorithm, keyBuffer, ivBuffer);
    let decrypted = decipher.update(encrypted.encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    if (!decrypted) {
      throw new Error('Decryption resulted in empty string');
    }

    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error.message, error.stack, 'Data:', JSON.stringify(encrypted));
    throw new Error(`Decryption failed: ${error.message}`);
  }
};

const hashPassword = async (password) => {
  try {
    if (!password) {
      throw new Error('No password provided for hashing');
    }

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);
    return encryptAES(hashed);
  } catch (error) {
    console.error('Hash password error:', error.message, error.stack);
    throw new Error(`Password hashing failed: ${error.message}`);
  }
};

const comparePassword = async (password, encrypted) => {
  try {
    if (!password) {
      console.error('Compare password error: No password provided');
      return false;
    }

    if (!encrypted || typeof encrypted !== 'object') {
      console.error('Compare password error: Invalid encrypted data', typeof encrypted, encrypted);
      return false;
    }

    // Handle both the case where encrypted is already a string (bcrypt hash) 
    // and the case where it's an object with iv and encryptedData
    let hashedPassword;

    if (encrypted.iv && encrypted.encryptedData) {
      // It's our encrypted format, decrypt it
      hashedPassword = decryptAES(encrypted);
    } else if (typeof encrypted === 'string') {
      // It's already a bcrypt hash
      hashedPassword = encrypted;
    } else {
      console.error('Unknown password format:', encrypted);
      return false;
    }

    // Log for debugging but don't expose full hashed password
    console.log('Password comparison: Plain password length:', password.length,
      'Hashed password format:', typeof hashedPassword,
      'Hashed password length:', hashedPassword.length);

    return await bcrypt.compare(password, hashedPassword);
  } catch (error) {
    console.error('Compare password error:', error.message, error.stack);
    // Return false instead of throwing to avoid 500 errors
    return false;
  }
};

module.exports = { hashPassword, comparePassword };