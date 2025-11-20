/* // Script to seed the database with initial data
import { seedDatabase } from '../lib/db-seed';

// Run the seed function
seedDatabase()
  .then((success) => {
    if (success) {
      console.log('Database seeded successfully');
    } else {
      console.error('Failed to seed database');
    }
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('Error during database seeding:', error);
    process.exit(1);
  });
 */