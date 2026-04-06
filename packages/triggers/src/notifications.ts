/**
 * Notification delivery — chat messages + email.
 */

import { db, conversations, eq, and } from "@doost/db";

import type { TriggerNotification } from "./definitions";

/**
 * Deliver a trigger notification to the user.
 * 1. Insert a system message into their active conversation.
 * 2. (Future) Send email via Resend for high-priority notifications.
 */
export async function deliverNotification(
  orgId: string,
  notification: TriggerNotification,
): Promise<void> {
  // Find the active conversation for this org
  const [activeConversation] = await db
    .select({ id: conversations.id, messages: conversations.messages })
    .from(conversations)
    .where(
      and(
        eq(conversations.orgId, orgId),
        eq(conversations.isActive, true),
      ),
    )
    .limit(1);

  if (!activeConversation) return;

  // Deduplication: check last 5 messages for same trigger content
  const recentMessages = (activeConversation.messages ?? []).slice(-5);
  const isDuplicate = recentMessages.some(
    (m) => m.role === "assistant" && m.content.includes(notification.title),
  );
  if (isDuplicate) return;

  // Append a system message to the conversation
  const systemMessage = {
    id: crypto.randomUUID(),
    role: "assistant" as const,
    content: `**${notification.title}**\n\n${notification.body}`,
    createdAt: new Date().toISOString(),
  };

  const updatedMessages = [
    ...(activeConversation.messages ?? []),
    systemMessage,
  ];

  await db
    .update(conversations)
    .set({
      messages: updatedMessages,
      updatedAt: new Date(),
    })
    .where(eq(conversations.id, activeConversation.id));
}
