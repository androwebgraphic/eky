/**
 * Reset False Violations Script
 * 
 * The previous word filter was too aggressive and flagged common words
 * like "koliko", "tražim", "offer", "deal", "cost", etc.
 * 
 * This script resets all users' violation counts, suspensions, and deletions
 * that were caused by false positives.
 * 
 * Run: node server/scripts/reset_false_violations.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('../models/userModel');

async function resetFalseViolations() {
  try {
    const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!MONGO_URI) {
      console.error('ERROR: MONGODB_URI not found in environment');
      process.exit(1);
    }

    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Find all users with violations, suspensions, or deletions
    const usersWithViolations = await User.find({
      $or: [
        { violationCount: { $gt: 0 } },
        { suspendedUntil: { $ne: null, $exists: true } },
        { isDeleted: true }
      ]
    });

    console.log(`\nFound ${usersWithViolations.length} users with violations/suspensions/deletions`);

    let resetCount = 0;
    for (const user of usersWithViolations) {
      const before = {
        violationCount: user.violationCount || 0,
        suspendedUntil: user.suspendedUntil,
        isDeleted: user.isDeleted,
        lastViolationDate: user.lastViolationDate
      };

      // Reset all violation-related fields
      user.violationCount = 0;
      user.lastViolationDate = null;
      user.suspendedUntil = null;
      user.isDeleted = false;

      await user.save();
      resetCount++;

      console.log(`\nReset user ${user.username || user._id}:`);
      console.log(`  Before:`, JSON.stringify(before));
      console.log(`  After: violationCount=0, suspendedUntil=null, isDeleted=false`);
    }

    // Also delete system warning messages from chat
    const ChatMessage = require('../models/chatMessageModel');
    const deletedWarnings = await ChatMessage.deleteMany({
      messageType: 'system_warning'
    });
    console.log(`\nDeleted ${deletedWarnings.deletedCount} system warning messages from chat`);

    console.log(`\n=== SUMMARY ===`);
    console.log(`Users reset: ${resetCount}`);
    console.log(`Warning messages deleted: ${deletedWarnings.deletedCount}`);
    console.log(`\nDone!`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

resetFalseViolations();