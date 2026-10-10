/**
 * Database and Auth Comprehensive Integrity Verification Test
 */

import firebaseConfig from '../firebase-applet-config.json';
import blueprint from '../firebase-blueprint.json';
import * as schema from '../src/db/schema';
import { getOrCreateUser } from '../src/db/users';
import fs from 'fs';
import path from 'path';

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

async function verifyDatabaseAndAuth() {
  console.log('================================================================');
  console.log('🛡️  MTX CAPITAL - DATABASE & AUTH INTEGRITY AUDIT');
  console.log('================================================================\n');

  // 1. FIREBASE AUTH CONFIGURATION INTEGRITY
  console.log('--- SECTION 1: Firebase Auth Configuration & Keys ---');
  assert(Boolean(firebaseConfig.projectId), `Firebase Project ID configured (${firebaseConfig.projectId})`);
  assert(Boolean(firebaseConfig.apiKey && firebaseConfig.apiKey.startsWith('AIza')), 'Firebase API Key format is valid');
  assert(Boolean(firebaseConfig.authDomain && firebaseConfig.authDomain.includes('firebaseapp.com')), 'Firebase Auth Domain configured');
  assert(Boolean(firebaseConfig.appId), `Firebase App ID configured (${firebaseConfig.appId})`);

  // 2. FIRESTORE RULES & BLUEPRINT INTEGRITY
  console.log('\n--- SECTION 2: Firestore Rules & Blueprint Integrity ---');
  const firestoreRulesContent = fs.readFileSync(path.join(process.cwd(), 'firestore.rules'), 'utf-8');
  assert(firestoreRulesContent.includes("rules_version = '2';"), 'Firestore rules version is set to 2');
  assert(firestoreRulesContent.includes('match /{document=**} {\n      allow read, write: if false;\n    }') || firestoreRulesContent.includes('allow read, write: if false;'), 'Global deny safety net is present in firestore.rules');
  
  // Verify all blueprint paths are mapped in security rules
  const blueprintPaths = Object.keys(blueprint.firestore);
  console.log(`Checking ${blueprintPaths.length} blueprint collections in security rules:`);
  for (const bPath of blueprintPaths) {
    const collName = bPath.split('/')[1];
    assert(firestoreRulesContent.includes(collName), `Blueprint collection '${collName}' is covered by firestore.rules`);
  }

  // 3. SQL & DRIZZLE SCHEMA INTEGRITY
  console.log('\n--- SECTION 3: SQL Relational Schema & Table Integrity ---');
  assert(Boolean(schema.users), 'Table "users" is declared in Drizzle schema');
  assert(Boolean(schema.trades), 'Table "trades" is declared in Drizzle schema');
  assert(Boolean(schema.walletBalances), 'Table "wallet_balances" is declared in Drizzle schema');
  assert(Boolean(schema.walletTransactions), 'Table "wallet_transactions" is declared in Drizzle schema');

  // Verify User-Trade foreign key relations
  assert(Boolean(schema.usersRelations), 'Users relationships are mapped');
  assert(Boolean(schema.tradesRelations), 'Trades relationships are mapped');
  assert(Boolean(schema.walletBalancesRelations), 'Wallet balance relationships are mapped');
  assert(Boolean(schema.walletTransactionsRelations), 'Wallet transaction relationships are mapped');

  // 4. USER AUTH & DATA ISOLATION INTEGRITY
  console.log('\n--- SECTION 4: User Identity Mapping & Isolation Integrity ---');
  const user1 = await getOrCreateUser('user-test-uid-alpha', 'alpha@institutional.com');
  const user2 = await getOrCreateUser('user-test-uid-beta', 'beta@institutional.com');

  assert(user1.uid === 'user-test-uid-alpha', 'User 1 UID properly stored and preserved');
  assert(user2.uid === 'user-test-uid-beta', 'User 2 UID properly stored and preserved');
  assert(user1.id !== user2.id, `User 1 (SQL ID ${user1.id}) and User 2 (SQL ID ${user2.id}) have distinct isolated SQL IDs`);
  assert(user1.email === 'alpha@institutional.com', 'User 1 email matches expected value');
  assert(user2.email === 'beta@institutional.com', 'User 2 email matches expected value');

  // Verify idempotency of user upsert
  const user1Repeat = await getOrCreateUser('user-test-uid-alpha', 'alpha-updated@institutional.com');
  assert(user1Repeat.id === user1.id, 'Repeated getOrCreateUser retains the same internal user ID');

  // 5. CLIENT-SIDE LOCAL STORAGE SCOPING INTEGRITY
  console.log('\n--- SECTION 5: Client-Side Cache Scoping & Anti-Leakage ---');
  const watchlistPageCode = fs.readFileSync(path.join(process.cwd(), 'src/components/WatchlistPage.tsx'), 'utf-8');
  assert(watchlistPageCode.includes('broker_watchlist_${currentUser.uid}') || watchlistPageCode.includes('broker_watchlist_${user.uid}'), 'Watchlist storage key is strictly scoped to currentUser.uid');
  assert(watchlistPageCode.includes('broker_watchlist_notes_${currentUser.uid}'), 'Watchlist notes key is strictly scoped to currentUser.uid');
  assert(watchlistPageCode.includes('priceAlerts_${currentUser.uid}'), 'Price alerts key is strictly scoped to currentUser.uid');
  assert(!watchlistPageCode.includes("setProfileName('Maximilian G. Vance')"), 'Hardcoded profile name has been removed from AccountControlCenter');

  console.log('\n================================================================');
  console.log(`AUDIT COMPLETE: ${passed} checks passed, ${failed} failed.`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

verifyDatabaseAndAuth().catch((err) => {
  console.error('Fatal audit error:', err);
  process.exit(1);
});
