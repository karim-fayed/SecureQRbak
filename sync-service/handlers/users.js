export default {
    insert: async (pool, doc) => {
        await pool.request().query(`
            INSERT INTO Users (mongoId, name, email, password, role, createdAt)
            VALUES (
                N'${doc._id}',
                N'${doc.name}',
                N'${doc.email}',
                N'${doc.password}',
                N'${doc.role}',
                GETDATE()
            )
        `);
    },

    update: async (pool, doc) => {
        await pool.request().query(`
            UPDATE Users
            SET name = N'${doc.name}',
                email = N'${doc.email}',
                password = N'${doc.password}',
                role = N'${doc.role}',
                updatedAt = GETDATE()
            WHERE mongoId = N'${doc._id}'
        `);
    },

    delete: async (pool, doc) => {
        await pool.request().query(`
            DELETE FROM Users WHERE mongoId = N'${doc._id}'
        `);
    }
};
