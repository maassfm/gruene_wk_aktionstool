-- CreateTable: user_teams join table
CREATE TABLE "user_teams" (
    "userId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,

    CONSTRAINT "user_teams_pkey" PRIMARY KEY ("userId","teamId")
);

-- Migrate existing teamId data to join table
INSERT INTO "user_teams" ("userId", "teamId")
SELECT "id", "teamId" FROM "users" WHERE "teamId" IS NOT NULL;

-- AddForeignKey
ALTER TABLE "user_teams" ADD CONSTRAINT "user_teams_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_teams" ADD CONSTRAINT "user_teams_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable: remove teamId from users
ALTER TABLE "users" DROP COLUMN "teamId";
