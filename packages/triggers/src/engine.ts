/**
 * Trigger evaluation engine.
 * Runs per-org, checks cooldowns, evaluates conditions, fires actions.
 */

import { db, profileTriggers, eq, and, desc } from "@doost/db";

import { TRIGGERS, type TriggerConditionInput, type TriggerNotification } from "./definitions";
import { deliverNotification } from "./notifications";

/**
 * Evaluate all triggers for a single organization.
 * Returns the number of triggers that fired.
 */
export async function evaluateTriggersForOrg(
  orgId: string,
  input: TriggerConditionInput,
): Promise<number> {
  let fired = 0;

  for (const trigger of TRIGGERS) {
    // Check cooldown — has this trigger fired recently for this org?
    const lastFired = await getLastTriggerFire(orgId, trigger.id);
    if (lastFired) {
      const daysSinceLast = Math.floor(
        (Date.now() - lastFired.getTime()) / (1000 * 60 * 60 * 24),
      );
      if (daysSinceLast < trigger.cooldownDays) continue;
    }

    // Evaluate condition
    if (!trigger.condition(input)) continue;

    // Build notification and deliver
    const notification = trigger.buildNotification(input);
    await fireTrigger(orgId, trigger.id, notification);
    fired++;
  }

  return fired;
}

async function getLastTriggerFire(
  orgId: string,
  triggerId: string,
): Promise<Date | null> {
  const [last] = await db
    .select({ firedAt: profileTriggers.firedAt })
    .from(profileTriggers)
    .where(
      and(
        eq(profileTriggers.orgId, orgId),
        eq(profileTriggers.triggerId, triggerId),
      ),
    )
    .orderBy(desc(profileTriggers.firedAt))
    .limit(1);

  return last?.firedAt ?? null;
}

async function fireTrigger(
  orgId: string,
  triggerId: string,
  notification: TriggerNotification,
): Promise<void> {
  // Record the trigger fire
  await db.insert(profileTriggers).values({
    orgId,
    triggerId,
    triggerData: notification as unknown as Record<string, unknown>,
    notificationSent: true,
  });

  // Deliver notification
  await deliverNotification(orgId, notification);
}
