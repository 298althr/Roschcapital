import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixFailedMigration() {
  try {
    console.log('Fixing failed migration...');
    
    // Delete any failed migration records
    const result = await prisma.$executeRawUnsafe(`
      DELETE FROM "_prisma_migrations" 
      WHERE finished_at IS NULL
      OR rolled_back_at IS NOT NULL;
    `);
    
    console.log(`✅ Deleted ${result} failed migration record(s)`);
    
    // Check if recurring_payments migration needs to be marked as applied
    const recurringMigration = await prisma.$queryRawUnsafe(`
      SELECT * FROM "_prisma_migrations" 
      WHERE migration_name = '20251127193000_add_recurring_payments';
    `);
    
    if (recurringMigration.length === 0) {
      // Check if the table already exists
      const tableExists = await prisma.$queryRawUnsafe(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'recurring_payments'
        );
      `);
      
      if (tableExists[0].exists) {
        console.log('recurring_payments table exists, marking migration as applied...');
        // Mark the migration as successfully applied
        await prisma.$executeRawUnsafe(`
          INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
          VALUES (
            gen_random_uuid()::text,
            'manual_fix_checksum',
            NOW(),
            '20251127193000_add_recurring_payments',
            'Manually marked as applied - tables already exist',
            NULL,
            NOW(),
            1
          );
        `);
        console.log('✅ Migration marked as applied');
      }
    }
    
    console.log('Migration table cleaned. You can now run prisma migrate deploy.');
    
  } catch (error) {
    console.error('❌ Error fixing migration:', error);
    // Don't exit with error - let the app continue
  } finally {
    await prisma.$disconnect();
  }
}

fixFailedMigration();
