import { NextResponse } from 'next/server';
import { journeyDatabaseService } from '@/services/firebase/JourneyDatabaseService';
import { auth } from '@/lib/firebase';

export async function POST() {
  try {

    const currentUser = auth.currentUser;

    if (!currentUser) {
      return NextResponse.json(
        { error: 'Not authenticated. Please login first.' },
        { status: 401 }
      );
    }

    console.log(' User authenticated:', currentUser.uid);

    const testJourney = {
      name: ' European + US Adventure',
      description: 'Testing medallion transport icons (flight, train, car)',
      color: '#FF6B6B',
      isPublic: true,
      tags: ['test', 'medallions'],
      steps: [

        {
          name: 'Istanbul, Turkey',
          coordinates: [28.9784, 41.0082] as [number, number],
          order: 0,
          transportToNext: 'flight' as const,
          timestamp: Date.now(),
          notes: 'Starting point - Turkish Airlines flight',
        },

        {
          name: 'Paris, France',
          coordinates: [2.3522, 48.8566] as [number, number],
          order: 1,
          transportToNext: 'train' as const,
          timestamp: Date.now() + 1000,
          notes: 'Eurostar to London',
        },

        {
          name: 'London, UK',
          coordinates: [-0.1276, 51.5074] as [number, number],
          order: 2,
          transportToNext: 'flight' as const,
          timestamp: Date.now() + 2000,
          notes: 'British Airways flight to NYC',
        },

        {
          name: 'New York, USA',
          coordinates: [-74.0060, 40.7128] as [number, number],
          order: 3,
          transportToNext: null,
          timestamp: Date.now() + 3000,
          notes: 'Final destination',
        },
      ],
    };

    console.log(' Creating test journey with medallion icons...');
    console.log(' Route:', testJourney.steps.map(s => s.name).join(' → '));
    console.log(' Transport modes:', testJourney.steps.filter(s => s.transportToNext).map(s => s.transportToNext).join(', '));

    const createdJourney = await journeyDatabaseService.createJourney(testJourney, currentUser.uid);

    console.log(' Journey created successfully!');
    console.log('Journey ID:', createdJourney.id);
    console.log('Total Distance:', createdJourney.totalDistance, 'km');
    console.log('Steps:', createdJourney.steps.length);

    return NextResponse.json({
      success: true,
      message: 'Test journey created! Reload the page to see medallions.',
      journey: {
        id: createdJourney.id,
        name: createdJourney.name,
        steps: createdJourney.steps.length,
        totalDistance: createdJourney.totalDistance,
        transportModes: testJourney.steps.filter(s => s.transportToNext).map(s => s.transportToNext),
      },
      expectedMedallions: [
        '1️ Istanbul → Paris: ️ FLIGHT (blue circle, airplane icon)',
        '2️ Paris → London:  TRAIN (green circle, train icon)',
        '3️ London → NYC: ️ FLIGHT (blue circle, airplane icon)',
      ],
    });

  } catch (error) {
    console.error(' Error creating test journey:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create test journey', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}
