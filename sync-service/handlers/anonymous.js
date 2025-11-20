export default {
    insert: async (pool, doc) => {
        await pool.request().query(`
            INSERT INTO AnonymousUsage (sessionId, action, data, ipAddress, userAgent, createdAt)
            VALUES (
                N'${doc.sessionId}',
                N'${doc.action}',
                N'${JSON.stringify(doc.data)}',
                N'${doc.ipAddress}',
                N'${doc.userAgent}',
                GETDATE()
            )
        `);
    },

    update: async (pool, doc) => {
        await pool.request().query(`
            UPDATE AnonymousUsage
            SET sessionId = N'${doc.sessionId}',
                action = N'${doc.action}',
                data = N'${JSON.stringify(doc.data)}',
                ipAddress = N'${doc.ipAddress}',
                userAgent = N'${doc.userAgent}'
            WHERE id = ${doc.id}
        `);
    },

    delete: async (pool, doc) => {
        await pool.request().query(`
            DELETE FROM AnonymousUsage WHERE id = ${doc.id}
        `);
    }
};
