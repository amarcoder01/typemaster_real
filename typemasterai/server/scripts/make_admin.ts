
import 'dotenv/config';
import { db } from '../storage';
import { users, feedbackAdmins } from '@shared/schema';
import { eq } from 'drizzle-orm';

async function makeAdmin(username: string) {
    if (!username) {
        console.error('Please provide a username.');
        process.exit(1);
    }

    console.log(`Promoting user '${username}' to feedback admin...`);

    try {
        const [user] = await db.select().from(users).where(eq(users.username, username)).limit(1);

        if (!user) {
            console.error(`User '${username}' not found.`);
            process.exit(1);
        }

        // Check if already admin
        const [existingAdmin] = await db.select().from(feedbackAdmins).where(eq(feedbackAdmins.userId, user.id)).limit(1);

        if (existingAdmin) {
            console.log(`User '${username}' is already an admin.`);
            process.exit(0);
        }

        await db.insert(feedbackAdmins).values({
            userId: user.id,
            role: 'super_admin',
        });

        console.log(`Successfully promoted '${username}' to feedback admin!`);
    } catch (error) {
        console.error('Failed to promote user:', error);
        process.exit(1);
    }
}

const username = process.argv[2];
makeAdmin(username);
