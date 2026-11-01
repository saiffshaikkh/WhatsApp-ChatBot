-- Additive transport state. Existing memory conversations retain a NULL channel.
ALTER TABLE "Conversation" ADD COLUMN "whatsappPhoneNumberId" VARCHAR(32);
CREATE UNIQUE INDEX "Conversation_customerId_whatsappPhoneNumberId_key" ON "Conversation"("customerId", "whatsappPhoneNumberId");

CREATE TYPE "WhatsAppDeliveryStatus" AS ENUM ('PENDING', 'SENDING', 'ACCEPTED', 'FAILED', 'UNCERTAIN', 'EXPIRED');
CREATE TABLE "WhatsAppDelivery" (
    "id" UUID NOT NULL,
    "phoneNumberId" VARCHAR(32) NOT NULL,
    "messageId" VARCHAR(256) NOT NULL,
    "customerId" UUID NOT NULL,
    "conversationId" UUID NOT NULL,
    "sentAt" TIMESTAMPTZ(3) NOT NULL,
    "reply" VARCHAR(4096) NOT NULL,
    "status" "WhatsAppDeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "nextAttemptAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "claimedAt" TIMESTAMPTZ(3),
    "outgoingMessageId" VARCHAR(256),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WhatsAppDelivery_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "WhatsAppDelivery_phoneNumberId_messageId_key" ON "WhatsAppDelivery"("phoneNumberId", "messageId");
CREATE INDEX "WhatsAppDelivery_phoneNumberId_status_nextAttemptAt_idx" ON "WhatsAppDelivery"("phoneNumberId", "status", "nextAttemptAt");
ALTER TABLE "WhatsAppDelivery" ADD CONSTRAINT "WhatsAppDelivery_conversationId_customerId_fkey" FOREIGN KEY ("conversationId", "customerId") REFERENCES "Conversation"("id", "customerId") ON DELETE CASCADE ON UPDATE CASCADE;
