import { db } from "./index";
import { messages } from "./schema/chat";
import { users } from "./schema/users";
import { eq, desc, aliasedTable } from "drizzle-orm";

async function run() {
  try {
    console.log("Testing alias query...");

    // Correct usage: aliasedTable
    const originalSigner = aliasedTable(users, "original_signer");

    const messagesList = await db
      .select({
        id: messages.id,
        content: messages.content,
        senderEmail: users.email,
        originalSignerName: originalSigner.name,
      })
      .from(messages)
      .leftJoin(users, eq(messages.senderId, users.id))
      .leftJoin(
        originalSigner,
        eq(messages.originalSignerId, originalSigner.id)
      )
      .orderBy(desc(messages.id))
      .limit(1);

    console.log("Query success:", messagesList);
  } catch (e) {
    console.error("Query failed:", e);
  }
}

run();
