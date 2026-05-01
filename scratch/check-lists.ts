import { createDatabase, user_lists, list_items } from './packages/db/src/index';
import { eq } from 'drizzle-orm';
import * as dotenv from 'dotenv';
dotenv.config();

async function checkLists() {
    const db = createDatabase(process.env.DATABASE_URL!);
    const lists = await db.select().from(user_lists);
    console.log('Total Lists:', lists.length);
    console.log('Lists:', JSON.stringify(lists, null, 2));

    const items = await db.select().from(list_items);
    console.log('Total Items:', items.length);
    console.log('Items:', JSON.stringify(items, null, 2));
}

checkLists();
