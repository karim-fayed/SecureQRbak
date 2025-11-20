export default {
    insert: async (pool, doc) => {
        let userId = null;
        if (doc.userId) {
            // First get the SQL userId from mongoId
            const userResult = await pool.request().query(`
                SELECT id FROM Users WHERE mongoId = N'${doc.userId}'
            `);
            userId = userResult.recordset[0]?.id;

            if (!userId) {
                throw new Error(`User with mongoId ${doc.userId} not found in SQL Server`);
            }
        }

        await pool.request().query(`
            INSERT INTO QRCodes (mongoId, name, data, encryptedData, signature, userId, isActive, createdAt)
            VALUES (
                N'${doc._id}',
                N'${doc.name}',
                N'${JSON.stringify(doc.data)}',
                N'${doc.encryptedData}',
                N'${doc.signature}',
                ${userId ? userId : 'NULL'},
                ${doc.isActive ? 1 : 0},
                GETDATE()
            )
        `);
    },

    update: async (pool, doc) => {
        // First get the SQL userId from mongoId
        const userResult = await pool.request().query(`
            SELECT id FROM Users WHERE mongoId = N'${doc.userId}'
        `);
        const userId = userResult.recordset[0]?.id;

        if (!userId) {
            throw new Error(`User with mongoId ${doc.userId} not found in SQL Server`);
        }

        await pool.request().query(`
            UPDATE QRCodes
            SET name = N'${doc.name}',
                data = N'${JSON.stringify(doc.data)}',
                encryptedData = N'${doc.encryptedData}',
                signature = N'${doc.signature}',
                userId = ${userId},
                isActive = ${doc.isActive ? 1 : 0},
                updatedAt = GETDATE()
            WHERE mongoId = N'${doc._id}'
        `);
    },

    delete: async (pool, doc) => {
        await pool.request().query(`
            DELETE FROM QRCodes WHERE mongoId = N'${doc._id}'
        `);
    }
};
