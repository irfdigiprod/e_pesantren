import { db } from "./index";
import { messages } from "./schema/chat";
import { users } from "./schema/users";
import { eq, desc, and } from "drizzle-orm";

async function run() {
  try {
    console.log("Running getMessages query simulation...");
    const messagesList = await db
      .select({
        id: messages.id,
        content: messages.content,
        isSigned: messages.isSigned,
        senderEmail: users.email,
      })
      .from(messages)
      .leftJoin(users, eq(messages.senderId, users.id))
      .orderBy(desc(messages.id))
      .limit(5);

    console.log("Query success. Rows:", messagesList.length);
    console.log("Sample:", messagesList[0]);
  } catch (e) {
    console.error("Query failed:", e);
  }
}

run();
