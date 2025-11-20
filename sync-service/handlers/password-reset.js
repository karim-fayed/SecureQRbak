export default {
    insert: async (pool, doc) => {
        // Get SQL userId from mongoId
        const userResult = await pool.request().query(`
            SELECT id FROM Users WHERE mongoId = N'${doc.userId}'
        `);
        const userId = userResult.recordset[0]?.id;

        if (!userId) {
            throw new Error(`User with mongoId ${doc.userId} not found in SQL Server`);
        }

        await pool.request().query(`
            INSERT INTO PasswordResetRequests (mongoId, userId, userEmail, userName, status, createdAt)
            VALUES (
                N'${doc._id}',
                ${userId},
                N'${doc.userEmail}',
                N'${doc.userName}',
                N'${doc.status}',
                GETDATE()
            )
        `);
    },

    update: async (pool, doc) => {
        // Get SQL userId from mongoId
        const userResult = await pool.request().query(`
            SELECT id FROM Users WHERE mongoId = N'${doc.userId}'
        `);
        const userId = userResult.recordset[0]?.id;

        if (!userId) {
            throw new Error(`User with mongoId ${doc.userId} not found in SQL Server`);
        }

        await pool.request().query(`
            UPDATE PasswordResetRequests
            SET userId = ${userId},
                userEmail = N'${doc.userEmail}',
                userName = N'${doc.userName}',
                status = N'${doc.status}',
                updatedAt = GETDATE()
            WHERE mongoId = N'${doc._id}'
        `);
    },

    delete: async (pool, doc) => {
        await pool.request().query(`
            DELETE FROM PasswordResetRequests WHERE mongoId = N'${doc._id}'
        `);
    }
};
