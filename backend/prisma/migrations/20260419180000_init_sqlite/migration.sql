-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "onboarding_complete" BOOLEAN NOT NULL DEFAULT false,
    "display_name" TEXT,
    "school_year" TEXT,
    "is_first_year" BOOLEAN NOT NULL DEFAULT false,
    "housing_type" TEXT,
    "dorm_ranking" TEXT NOT NULL DEFAULT '[]',
    "preferred_areas" TEXT NOT NULL DEFAULT '[]',
    "room_style_preferences" TEXT NOT NULL DEFAULT '[]',
    "budget_min" INTEGER,
    "budget_max" INTEGER,
    "lease_duration" TEXT,
    "move_in_date" DATETIME,
    "off_campus_room_type" TEXT,
    "gender_preference" TEXT,
    "sleep_schedule" TEXT,
    "cleanliness_level" INTEGER,
    "guests_frequency" TEXT,
    "study_environment" TEXT,
    "noise_tolerance" TEXT,
    "smoking_stance" TEXT,
    "drinking_stance" TEXT,
    "pets_stance" TEXT,
    "introvert_extrovert" INTEGER,
    "social_habits" TEXT,
    "conflict_style" TEXT,
    "shared_activities" TEXT NOT NULL DEFAULT '[]',
    "bio" TEXT,
    "tags" TEXT NOT NULL DEFAULT '[]',
    "avatar_url" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "Profile_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Preference" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "profile_id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "strength" INTEGER NOT NULL DEFAULT 5,
    "dealbreaker" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "Preference_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "Profile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Like" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "liker_id" TEXT NOT NULL,
    "liked_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Like_liker_id_fkey" FOREIGN KEY ("liker_id") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Like_liked_id_fkey" FOREIGN KEY ("liked_id") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Pass" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "passer_id" TEXT NOT NULL,
    "passed_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Pass_passer_id_fkey" FOREIGN KEY ("passer_id") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Pass_passed_id_fkey" FOREIGN KEY ("passed_id") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_a_id" TEXT NOT NULL,
    "user_b_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Match_user_a_id_fkey" FOREIGN KEY ("user_a_id") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Match_user_b_id_fkey" FOREIGN KEY ("user_b_id") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "match_id" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,
    "receiver_id" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Message_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "Match" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Message_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Message_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Profile_user_id_key" ON "Profile"("user_id");

-- CreateIndex
CREATE INDEX "Profile_housing_type_is_first_year_onboarding_complete_idx" ON "Profile"("housing_type", "is_first_year", "onboarding_complete");

-- CreateIndex
CREATE INDEX "Preference_profile_id_idx" ON "Preference"("profile_id");

-- CreateIndex
CREATE INDEX "Preference_category_idx" ON "Preference"("category");

-- CreateIndex
CREATE UNIQUE INDEX "Preference_profile_id_category_key" ON "Preference"("profile_id", "category");

-- CreateIndex
CREATE INDEX "Like_liker_id_idx" ON "Like"("liker_id");

-- CreateIndex
CREATE INDEX "Like_liked_id_idx" ON "Like"("liked_id");

-- CreateIndex
CREATE UNIQUE INDEX "Like_liker_id_liked_id_key" ON "Like"("liker_id", "liked_id");

-- CreateIndex
CREATE INDEX "Pass_passer_id_idx" ON "Pass"("passer_id");

-- CreateIndex
CREATE INDEX "Pass_passed_id_idx" ON "Pass"("passed_id");

-- CreateIndex
CREATE UNIQUE INDEX "Pass_passer_id_passed_id_key" ON "Pass"("passer_id", "passed_id");

-- CreateIndex
CREATE INDEX "Match_user_a_id_idx" ON "Match"("user_a_id");

-- CreateIndex
CREATE INDEX "Match_user_b_id_idx" ON "Match"("user_b_id");

-- CreateIndex
CREATE UNIQUE INDEX "Match_user_a_id_user_b_id_key" ON "Match"("user_a_id", "user_b_id");

-- CreateIndex
CREATE INDEX "Message_match_id_idx" ON "Message"("match_id");

-- CreateIndex
CREATE INDEX "Message_sender_id_idx" ON "Message"("sender_id");

-- CreateIndex
CREATE INDEX "Message_receiver_id_idx" ON "Message"("receiver_id");

-- CreateIndex
CREATE INDEX "Message_match_id_created_at_idx" ON "Message"("match_id", "created_at");

