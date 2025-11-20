export default {
    insert: async (pool, doc) => {
        // Get SQL IDs from mongoIds
        const qrCodeResult = await pool.request().query(`
            SELECT id FROM QRCodes WHERE mongoId = N'${doc.qrCodeId}'
        `);
        const qrCodeId = qrCodeResult.recordset[0]?.id;

        if (!qrCodeId) {
            throw new Error(`QRCode with mongoId ${doc.qrCodeId} not found in SQL Server`);
        }

        let userId = null;
        if (doc.userId) {
            const userResult = await pool.request().query(`
                SELECT id FROM Users WHERE mongoId = N'${doc.userId}'
            `);
            userId = userResult.recordset[0]?.id;
        }

        await pool.request().query(`
            INSERT INTO QRCodeScans (mongoId, qrCodeId, userId, status, ipAddress, userAgent, scannedAt)
            VALUES (
                N'${doc._id}',
                ${qrCodeId},
                ${userId || "NULL"},
                N'${doc.status}',
                N'${doc.ipAddress}',
                N'${doc.userAgent}',
                GETDATE()
            )
        `);
    },

    update: async (pool, doc) => {
        // Get SQL IDs from mongoIds
        const qrCodeResult = await pool.request().query(`
            SELECT id FROM QRCodes WHERE mongoId = N'${doc.qrCodeId}'
        `);
        const qrCodeId = qrCodeResult.recordset[0]?.id;

        if (!qrCodeId) {
            throw new Error(`QRCode with mongoId ${doc.qrCodeId} not found in SQL Server`);
        }

        let userId = null;
        if (doc.userId) {
            const userResult = await pool.request().query(`
                SELECT id FROM Users WHERE mongoId = N'${doc.userId}'
            `);
            userId = userResult.recordset[0]?.id;
        }

        await pool.request().query(`
            UPDATE QRCodeScans
            SET qrCodeId = ${qrCodeId},
                userId = ${userId || "NULL"},
                status = N'${doc.status}',
                ipAddress = N'${doc.ipAddress}',
                userAgent = N'${doc.userAgent}'
            WHERE mongoId = N'${doc._id}'
        `);
    },

    delete: async (pool, doc) => {
        await pool.request().query(`
            DELETE FROM QRCodeScans WHERE mongoId = N'${doc._id}'
        `);
    }
};
