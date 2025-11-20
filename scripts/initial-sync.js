const { runInitialSync } = require('../lib/initial-sync');

async function main() {
  console.log('Starting initial database synchronization...');

  try {
    const results = await runInitialSync();

    console.log('\n=== SYNCHRONIZATION RESULTS ===\n');

    results.forEach(result => {
      console.log(`📊 ${result.collection}:`);
      console.log(`   Total Records: ${result.totalRecords}`);
      console.log(`   Synced Records: ${result.syncedRecords}`);
      console.log(`   Errors: ${result.errors}`);
      console.log(`   Duration: ${result.duration}ms`);
      console.log(`   Success Rate: ${result.totalRecords > 0 ? ((result.syncedRecords / result.totalRecords) * 100).toFixed(2) : 0}%`);
      console.log('---');
    });

    const totalRecords = results.reduce((sum, r) => sum + r.totalRecords, 0);
    const totalSynced = results.reduce((sum, r) => sum + r.syncedRecords, 0);
    const totalErrors = results.reduce((sum, r) => sum + r.errors, 0);
    const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

    console.log('🎯 OVERALL SUMMARY:');
    console.log(`   Total Records Processed: ${totalRecords}`);
    console.log(`   Total Records Synced: ${totalSynced}`);
    console.log(`   Total Errors: ${totalErrors}`);
    console.log(`   Total Duration: ${totalDuration}ms`);
    console.log(`   Overall Success Rate: ${totalRecords > 0 ? ((totalSynced / totalRecords) * 100).toFixed(2) : 0}%`);

    if (totalErrors === 0) {
      console.log('\n✅ Initial synchronization completed successfully!');
    } else {
      console.log(`\n⚠️  Initial synchronization completed with ${totalErrors} errors.`);
      console.log('Please check the logs above for details.');
    }

  } catch (error) {
    console.error('❌ Initial synchronization failed:', error);
    process.exit(1);
  }
}

main().catch(console.error);
