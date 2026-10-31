-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "MessageRole" AS ENUM ('USER', 'ASSISTANT');

-- CreateTable
CREATE TABLE "Customer" (
    "id" UUID NOT NULL,
    "whatsappId" VARCHAR(20) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" UUID NOT NULL,
    "customerId" UUID NOT NULL,
    "contextVersion" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" UUID NOT NULL,
    "customerId" UUID NOT NULL,
    "conversationId" UUID NOT NULL,
    "role" "MessageRole" NOT NULL,
    "content" VARCHAR(8000) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerPreference" (
    "id" UUID NOT NULL,
    "customerId" UUID NOT NULL,
    "key" VARCHAR(64) NOT NULL,
    "value" VARCHAR(1000) NOT NULL,
    "consentedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "CustomerPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConversationSummary" (
    "id" UUID NOT NULL,
    "customerId" UUID NOT NULL,
    "conversationId" UUID NOT NULL,
    "content" VARCHAR(8000) NOT NULL,
    "sourceVersion" INTEGER NOT NULL,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "ConversationSummary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Customer_whatsappId_key" ON "Customer"("whatsappId");

-- CreateIndex
CREATE INDEX "Conversation_customerId_createdAt_idx" ON "Conversation"("customerId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_id_customerId_key" ON "Conversation"("id", "customerId");

-- CreateIndex
CREATE INDEX "Message_customerId_conversationId_createdAt_id_idx" ON "Message"("customerId", "conversationId", "createdAt", "id");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerPreference_customerId_key_key" ON "CustomerPreference"("customerId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "ConversationSummary_conversationId_customerId_key" ON "ConversationSummary"("conversationId", "customerId");

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_customerId_fkey" FOREIGN KEY ("conversationId", "customerId") REFERENCES "Conversation"("id", "customerId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerPreference" ADD CONSTRAINT "CustomerPreference_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationSummary" ADD CONSTRAINT "ConversationSummary_conversationId_customerId_fkey" FOREIGN KEY ("conversationId", "customerId") REFERENCES "Conversation"("id", "customerId") ON DELETE CASCADE ON UPDATE CASCADE;
