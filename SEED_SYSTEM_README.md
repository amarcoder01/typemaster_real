# Leaderboard Seed System

A comprehensive system for populating leaderboards with realistic test data for development and testing.

## Features

- ✨ **Realistic Data Generation**: Uses statistical distributions based on real-world typing test data
- 🎯 **Configurable**: Easy to customize user counts, skill distributions, and test parameters
- 🔒 **Safe**: Test data is clearly marked and can be easily cleaned up
- 📊 **Statistical Accuracy**: Follows industry benchmarks for WPM and accuracy distributions
- 🚀 **Fast**: Generates 150 users with ~2000 test results in seconds
- 🧪 **Dry Run Mode**: Preview what will be created without touching the database

## Quick Start

### Generate Test Data

```bash
# Dry run (preview without saving)
npm run seed:dry-run

# Seed 10 users (quick test)
npm run seed:standard:quick

# Seed 150 users (full dataset)
npm run seed:standard
```

### View Statistics

```bash
npm run seed:stats
```

### Clean Up Test Data

```bash
npm run seed:clean
```

## Available Commands

| Command | Description |
|---------|-------------|
| `npm run seed:standard` | Seed 150 users for standard mode |
| `npm run seed:standard:quick` | Seed 10 users for quick testing |
| `npm run seed:dry-run` | Preview generation without saving |
| `npm run seed:stats` | Show current test data statistics |
| `npm run seed:clean` | Remove all test data |

## Data Distribution

### Skill Levels (WPM)

Based on real-world typing test statistics:

| Level | WPM Range | Mean | % of Users |
|-------|-----------|------|------------|
| Beginner | 15-50 | 35 | 10% |
| Intermediate | 40-75 | 55 | 30% |
| Advanced | 65-105 | 80 | 40% |
| Expert | 90-140 | 110 | 15% |
| Elite | 120-160 | 135 | 5% |

### Accuracy Ranges

| Skill Level | Accuracy Range | Mean |
|-------------|----------------|------|
| Beginner | 85-92% | 88.5% |
| Intermediate | 92-96% | 94% |
| Advanced | 96-98% | 97% |
| Expert | 97-99.5% | 98.5% |
| Elite | 97.5-99.8% | 98.8% |

### Activity Patterns

| Activity Level | Tests per User | % of Users |
|----------------|----------------|------------|
| Casual | 1-5 | 40% |
| Regular | 5-15 | 35% |
| Active | 15-50 | 20% |
| Power | 50-200 | 5% |

## Architecture

```
server/seed/
├── index.ts                    # CLI entry point
├── config.ts                   # Configuration & distributions
├── data/
│   └── names.json             # Curated name database (500+ names)
├── utils/
│   ├── name-generator.ts      # Username generation
│   ├── distribution.ts        # Statistical helpers
│   └── date-helper.ts         # Date utilities
├── factories/
│   └── user-factory.ts        # User creation
└── generators/
    └── standard-generator.ts  # Standard mode test results
```

## How It Works

### 1. User Generation

- Creates users with unique, realistic usernames
- Uses curated name database with international diversity
- Assigns random avatar colors
- Staggers creation dates to simulate organic growth

### 2. Test Result Generation

- Assigns each user a skill level based on realistic distribution
- Generates WPM values using normal distribution
- Correlates accuracy with WPM (speed-accuracy tradeoff)
- Simulates improvement over time
- Creates progressive test dates (older to newer)

### 3. Database Insertion

- Batches inserts for performance (50 at a time)
- Marks all data with `isTestData: true` flag
- Provides progress feedback during insertion

## Configuration

Edit `server/seed/config.ts` to customize:

```typescript
export const SEED_CONFIG = {
  usersPerMode: 150,              // Users to generate
  markAsTest: true,               // Mark as test data
  testUserPrefix: 'demo_',        // Username prefix
  // ... more options
};
```

## Safety Features

### Test Data Marking

All seeded data is marked with `isTestData: true` in the database, making it easy to identify and remove.

### Production Protection

- Refuses to run in production environment by default
- Requires explicit confirmation for destructive operations
- Dry-run mode available for safe preview

### Clean Separation

Test data is completely isolated from real user data and can be removed with a single command.

## Sample Output

```
🌱 Leaderboard Seed Tool

📝 Seeding Standard Mode (150 users)

1. Generating users...
   ✓ Generated 150 users

   Sample usernames:
   1. demo_TyperHero
   2. demo_WizardJose
   3. demo_StrokePro
   ...

2. Generating test results...
   ✓ Generated 2005 test results
   📈 WPM range: 23 - 174 (avg: 85)
   🎯 Avg accuracy: 95.9%

3. Inserting into database...
   ✓ All data inserted successfully

✅ Seeding complete!
```

## Database Schema Changes

The seed system adds one new field to the `users` table:

```sql
ALTER TABLE users ADD COLUMN is_test_data BOOLEAN DEFAULT FALSE NOT NULL;
```

Run `npm run db:push` to apply this migration.

## Future Enhancements

The system is designed to be modular and extensible. Future modes can be added:

- Code Practice Mode
- Dictation Mode
- Stress Test Mode
- Racing/Rating Mode
- Book Library Mode

Each mode will have its own generator in `server/seed/generators/`.

## Troubleshooting

### "DATABASE_URL must be set"

Make sure your `.env` file contains a valid `DATABASE_URL` connection string.

### "Cannot find module 'commander'"

Run `npm install` to install all dependencies.

### Dry run works but actual seeding fails

Check database permissions and ensure the `is_test_data` column exists by running `npm run db:push`.

## Research & References

Data distributions are based on:

- TypingTest.com statistics
- Monkeytype user data
- Industry typing speed benchmarks
- Academic research on typing performance

## Contributing

To add a new mode:

1. Create generator in `server/seed/generators/`
2. Add mode configuration to `config.ts`
3. Update CLI commands in `index.ts`
4. Add tests and documentation

## License

Part of the Type-Master project.

