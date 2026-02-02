/**
 * TEST JOURNEY CREATION SCRIPT FOR MEDALLION ICONS
 * 
 * Copy-paste this into browser console (F12) while on the dashboard page.
 * This creates a sample journey with transport modes to test medallion rendering.
 */

// Import service (available globally on dashboard)
const { journeyDatabaseService } = await import('/src/services/firebase/JourneyDatabaseService.ts');

// Get current user ID from AuthContext
const user = JSON.parse(localStorage.getItem('user') || '{}');
if (!user.uid) {
  console.error('❌ No user found! Please login first.');
  throw new Error('User not authenticated');
}

console.log('✅ User ID:', user.uid);

// Create test journey with 4 stops (Istanbul → Paris → London → New York)
const testJourney = {
  name: '🌍 European + US Adventure',
  description: 'Testing medallion transport icons (flight, train, car)',
  color: '#FF6B6B', // Red color
  isPublic: true,
  tags: ['test', 'medallions'],
  steps: [
    // Step 1: Istanbul (start)
    {
      name: 'Istanbul, Turkey',
      coordinates: [28.9784, 41.0082], // [lng, lat]
      order: 0,
      transportToNext: 'flight', // ✈️ Flight to Paris
      timestamp: Date.now(),
      notes: 'Starting point - Turkish Airlines flight',
    },
    
    // Step 2: Paris
    {
      name: 'Paris, France',
      coordinates: [2.3522, 48.8566],
      order: 1,
      transportToNext: 'train', // 🚆 Eurostar to London
      timestamp: Date.now() + 1000,
      notes: 'Eurostar to London',
    },
    
    // Step 3: London
    {
      name: 'London, UK',
      coordinates: [-0.1276, 51.5074],
      order: 2,
      transportToNext: 'flight', // ✈️ Flight to NYC
      timestamp: Date.now() + 2000,
      notes: 'British Airways flight to NYC',
    },
    
    // Step 4: New York (end)
    {
      name: 'New York, USA',
      coordinates: [-74.0060, 40.7128],
      order: 3,
      transportToNext: null, // Last stop, no next transport
      timestamp: Date.now() + 3000,
      notes: 'Final destination',
    },
  ],
};

console.log('🎯 Creating test journey with medallion icons...');
console.log('📍 Route:', testJourney.steps.map(s => s.name).join(' → '));
console.log('🚀 Transport modes:', testJourney.steps.filter(s => s.transportToNext).map(s => s.transportToNext).join(', '));

try {
  const createdJourney = await journeyDatabaseService.createJourney(testJourney, user.uid);
  console.log('✅ Journey created successfully!');
  console.log('Journey ID:', createdJourney.id);
  console.log('Total Distance:', createdJourney.totalDistance, 'km');
  console.log('Steps:', createdJourney.steps.length);
  
  console.log('\n🎨 Expected medallion icons:');
  console.log('1️⃣ Istanbul → Paris: ✈️ FLIGHT (blue circle, airplane icon)');
  console.log('2️⃣ Paris → London: 🚆 TRAIN (green circle, train icon)');
  console.log('3️⃣ London → NYC: ✈️ FLIGHT (blue circle, airplane icon)');
  
  console.log('\n🔄 Reload the page to see the medallions on the map!');
  
  // Auto-reload after 2 seconds
  setTimeout(() => {
    window.location.reload();
  }, 2000);
  
} catch (error) {
  console.error('❌ Error creating journey:', error);
  throw error;
}
