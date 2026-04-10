#!/usr/bin/env node

/**
 * Diagnostic script to check server health and identify issues
 * Run with: node diagnose-server.js
 */

const dotenv = require('dotenv');
const mongoose = require('mongoose');

// Load environment variables
dotenv.config({ path: __dirname + '/.env' });

console.log('=== Server Diagnostic Tool ===\n');

// Check 1: Environment variables
console.log('1. Checking environment variables...');
const requiredVars = ['MONGO_URI', 'PORT', 'CLIENT_ORIGIN', 'API_BASE'];
const missingVars = requiredVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.log('❌ Missing environment variables:', missingVars.join(', '));
} else {
  console.log('✅ All required environment variables are set');
  console.log('   - MONGO_URI:', process.env.MONGO_URI ? 'SET (hidden)' : 'NOT SET');
  console.log('   - PORT:', process.env.PORT || '3001 (default)');
  console.log('   - CLIENT_ORIGIN:', process.env.CLIENT_ORIGIN);
  console.log('   - API_BASE:', process.env.API_BASE);
}
console.log();

// Check 2: MongoDB connection
console.log('2. Testing MongoDB connection...');
async function testMongoConnection() {
  try {
    if (!process.env.MONGO_URI) {
      console.log('❌ MONGO_URI not set');
      return false;
    }

    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 10000,
    });

    console.log('✅ MongoDB connection successful');
    console.log('   - Host:', conn.connection.host);
    console.log('   - Database:', conn.connection.name);
    
    // Test a simple query
    const User = require('./models/userModel.js');
    const userCount = await User.countDocuments();
    console.log('   - Users in database:', userCount);
    
    await mongoose.connection.close();
    return true;
  } catch (error) {
    console.log('❌ MongoDB connection failed:', error.message);
    return false;
  }
}

// Check 3: Check if server can start
console.log('3. Checking server file...');
const fs = require('fs');
const serverPath = __dirname + '/server.cjs';

if (fs.existsSync(serverPath)) {
  console.log('✅ server.cjs file exists');
  const stats = fs.statSync(serverPath);
  console.log('   - Size:', stats.size, 'bytes');
  console.log('   - Modified:', stats.mtime);
} else {
  console.log('❌ server.cjs file not found');
}
console.log();

// Check 4: Check dependencies
console.log('4. Checking dependencies...');
const packagePath = __dirname + '/package.json';
try {
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  const requiredDeps = ['express', 'mongoose', 'cors', 'socket.io', 'dotenv'];
  const missingDeps = requiredDeps.filter(dep => !packageJson.dependencies[dep]);
  
  if (missingDeps.length > 0) {
    console.log('❌ Missing dependencies:', missingDeps.join(', '));
    console.log('   Run: npm install', missingDeps.join(' '));
  } else {
    console.log('✅ All required dependencies are installed');
  }
} catch (error) {
  console.log('❌ Error reading package.json:', error.message);
}
console.log();

// Check 5: Port availability
console.log('5. Checking port availability...');
const net = require('net');
const port = process.env.PORT || 3001;

const server = net.createServer();
server.once('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log('❌ Port', port, 'is already in use');
    console.log('   Another process may be running on this port');
  } else {
    console.log('❌ Port check failed:', err.message);
  }
  server.close();
});

server.once('listening', () => {
  console.log('✅ Port', port, 'is available');
  server.close();
});

server.listen(port);

// Run MongoDB test
testMongoConnection().then(() => {
  console.log('\n=== Diagnostic Complete ===');
  console.log('\nIf all checks pass, try starting the server with:');
  console.log('  npm start');
  console.log('\nOr for development with auto-reload:');
  console.log('  npm run dev');
}).catch(err => {
  console.error('Diagnostic error:', err);
  process.exit(1);
});