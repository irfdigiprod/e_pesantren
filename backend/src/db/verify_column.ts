import { db } from "./index";
import { messages } from "./schema/chat";
import { sql } from "drizzle-orm";

async function run() {
  try {
    console.log("Querying one message...");
    const result = await db.select().from(messages).limit(1);
    console.log("Result:", result);

    if (result.length > 0) {
      console.log("isSigned value:", result[0].isSigned);
    } else {
      console.log("No messages found in DB.");
    }
  } catch (e) {
    console.error("Error querying messages:", e);
  }
}

run();
