-- DropIndex
DROP INDEX "UserProfile_userId_key";

-- AlterTable
ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("userId");
