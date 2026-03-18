// Paste this in your browser console at localhost:3000/dashboard
// to get your user ID

import { getAuth } from 'firebase/auth';

const auth = getAuth();
const userId = auth.currentUser?.uid;

console.log('====================');
console.log('YOUR USER ID:');
console.log(userId);
console.log('====================');
console.log('\nCopy this ID and run:');
console.log(`npx tsx scripts/test-notifications.ts ${userId}`);
