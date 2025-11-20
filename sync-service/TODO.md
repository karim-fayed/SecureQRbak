# TODO: Implement Full Synchronization with Automatic Table Creation and CRUD Operations

## Step 1: Add Automatic Table Creation
- [x] Create a function in `sql.js` to check and create missing tables based on MongoDB schemas.
- [x] Call this function in `index.js` during startup after connecting to SQL Server.

## Step 2: Update Handlers for Full CRUD
- [x] Update `handlers/users.js` to add `update` and `delete` methods.
- [x] Update `handlers/qrcodes.js` to add `update` and `delete` methods.
- [x] Update `handlers/scans.js` to add `update` and `delete` methods.
- [x] Update `handlers/password-reset.js` to add `update` and `delete` methods.
- [x] Update `handlers/anonymous.js` to add `update` and `delete` methods.

## Step 3: Update Real-Time Sync for Updates and Deletes
- [x] Modify `setupRealtimeSync` in `index.js` to listen for `update` and `delete` operations in change streams.
- [x] Enqueue appropriate handler methods for updates and deletes.

## Step 4: Enhance Batch Sync for Updates and Deletes
- [x] Update `getRecordsNeedingSync` in `utils.js` to handle updates and deletes (using timestamps or change logs).
- [x] Modify `syncBatch` to handle different operation types.

## Step 5: Initial Sync and Schema Alignment
- [x] Add initial sync logic to copy all existing MongoDB data to SQL Server on first run.
- [x] Ensure schema mapping from MongoDB to SQL Server tables.

## Step 6: Testing and Validation
- [x] Test table creation when tables are missing.
- [x] Test insert, update, delete operations sync in real-time.
- [x] Verify batch sync catches up on missed operations.
- [x] Check health monitoring and error handling.

## Step 7: Fix Model Overwrite Error
- [x] Fix "Cannot overwrite `users` model once compiled" error by passing pre-defined models to utility functions instead of creating new ones each time.
