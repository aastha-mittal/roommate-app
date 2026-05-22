import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash("password123", 10);

  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: "alice@cmu.edu" },
      create: { email: "alice@cmu.edu", passwordHash: hash, authProvider: "PASSWORD" },
      update: { passwordHash: hash, authProvider: "PASSWORD" },
    }),
    prisma.user.upsert({
      where: { email: "bob@cmu.edu" },
      create: { email: "bob@cmu.edu", passwordHash: hash, authProvider: "PASSWORD" },
      update: { passwordHash: hash, authProvider: "PASSWORD" },
    }),
    prisma.user.upsert({
      where: { email: "carol@cmu.edu" },
      create: { email: "carol@cmu.edu", passwordHash: hash, authProvider: "PASSWORD" },
      update: { passwordHash: hash, authProvider: "PASSWORD" },
    }),
    prisma.user.upsert({
      where: { email: "dave@cmu.edu" },
      create: { email: "dave@cmu.edu", passwordHash: hash, authProvider: "PASSWORD" },
      update: { passwordHash: hash, authProvider: "PASSWORD" },
    }),
    prisma.user.upsert({
      where: { email: "eve@cmu.edu" },
      create: { email: "eve@cmu.edu", passwordHash: hash, authProvider: "PASSWORD" },
      update: { passwordHash: hash, authProvider: "PASSWORD" },
    }),
  ]);

  const profileData = [
    {
      userId: users[0].id,
      displayName: "Alice",
      schoolYear: "GRAD" as const,
      isFirstYear: false,
      onboardingComplete: true,
      housingType: "OFF_CAMPUS" as const,
      preferredAreas: JSON.stringify(["SHADYSIDE", "SQUIRREL_HILL"]),
      dormRanking: "[]",
      roomStylePreferences: "[]",
      budgetMin: 800,
      budgetMax: 1200,
      leaseDuration: "12_MONTHS" as const,
      moveInDate: new Date("2025-08-01"),
      offCampusRoomType: "PRIVATE_ROOM_SHARED_UNIT" as const,
      sleepSchedule: "EARLY_BIRD" as const,
      cleanlinessLevel: 4,
      guestsFrequency: "SOMETIMES" as const,
      studyEnvironment: "QUIET" as const,
      noiseTolerance: "LOW" as const,
      smokingStance: "NO" as const,
      drinkingStance: "OCCASIONAL" as const,
      petsStance: "NO" as const,
      introvertExtrovert: 6,
      socialHabits: "BALANCED" as const,
      conflictStyle: "TALK_IT_OUT" as const,
      sharedActivities: JSON.stringify(["hiking", "cooking"]),
      bio: "CMU grad student, quiet and clean. Love morning coffee and weekend hikes.",
      tags: JSON.stringify(["grad", "quiet", "hiking", "cooking"]),
    },
    {
      userId: users[1].id,
      displayName: "Bob",
      schoolYear: "JUNIOR" as const,
      isFirstYear: false,
      onboardingComplete: true,
      housingType: "OFF_CAMPUS" as const,
      preferredAreas: JSON.stringify(["SHADYSIDE", "NORTH_OAKLAND"]),
      dormRanking: "[]",
      roomStylePreferences: "[]",
      budgetMin: 700,
      budgetMax: 1100,
      leaseDuration: "12_MONTHS" as const,
      moveInDate: new Date("2025-08-15"),
      offCampusRoomType: "PRIVATE_ROOM_SHARED_UNIT" as const,
      sleepSchedule: "NIGHT_OWL" as const,
      cleanlinessLevel: 3,
      guestsFrequency: "OFTEN" as const,
      studyEnvironment: "MODERATE" as const,
      noiseTolerance: "MEDIUM" as const,
      smokingStance: "NO" as const,
      drinkingStance: "YES" as const,
      petsStance: "NO" as const,
      introvertExtrovert: 7,
      socialHabits: "VERY_SOCIAL" as const,
      conflictStyle: "TALK_IT_OUT" as const,
      sharedActivities: JSON.stringify(["movies", "gaming"]),
      bio: "CS undergrad, love hosting friends. Down for movie nights and study sessions.",
      tags: JSON.stringify(["cs", "social", "gaming", "movies"]),
    },
    {
      userId: users[2].id,
      displayName: "Carol",
      schoolYear: "FRESHMAN" as const,
      isFirstYear: true,
      onboardingComplete: true,
      housingType: "ON_CAMPUS" as const,
      preferredAreas: "[]",
      dormRanking: JSON.stringify([
        "MOREWOOD_GARDENS",
        "STEVER_HOUSE",
        "MUDGE_HOUSE",
        "DONNER_HOUSE",
        "BOSS_HOUSE",
        "MCGILL_HOUSE",
        "SCOVELL_HOUSE",
      ]),
      roomStylePreferences: JSON.stringify(["DOUBLE", "SUITE"]),
      budgetMin: null,
      budgetMax: null,
      leaseDuration: null,
      moveInDate: null,
      offCampusRoomType: null,
      sleepSchedule: "EARLY_BIRD" as const,
      cleanlinessLevel: 5,
      guestsFrequency: "RARELY" as const,
      studyEnvironment: "QUIET" as const,
      noiseTolerance: "LOW" as const,
      smokingStance: "NO" as const,
      drinkingStance: "NO" as const,
      petsStance: "NO" as const,
      introvertExtrovert: 3,
      socialHabits: "HOME_BODY" as const,
      conflictStyle: "AVOID" as const,
      sharedActivities: JSON.stringify(["reading", "yoga"]),
      bio: "First-year, pre-med — need a calm and clean roommate. Early to bed.",
      tags: JSON.stringify(["premed", "quiet", "clean", "yoga"]),
    },
    {
      userId: users[3].id,
      displayName: "Dave",
      schoolYear: "FRESHMAN" as const,
      isFirstYear: true,
      onboardingComplete: true,
      housingType: "ON_CAMPUS" as const,
      preferredAreas: "[]",
      dormRanking: JSON.stringify([
        "STEVER_HOUSE",
        "MOREWOOD_GARDENS",
        "MUDGE_HOUSE",
        "DONNER_HOUSE",
        "BOSS_HOUSE",
        "MCGILL_HOUSE",
        "SCOVELL_HOUSE",
      ]),
      roomStylePreferences: JSON.stringify(["DOUBLE", "SINGLE"]),
      budgetMin: null,
      budgetMax: null,
      leaseDuration: null,
      moveInDate: null,
      offCampusRoomType: null,
      sleepSchedule: "EARLY_BIRD" as const,
      cleanlinessLevel: 4,
      guestsFrequency: "RARELY" as const,
      studyEnvironment: "QUIET" as const,
      noiseTolerance: "LOW" as const,
      smokingStance: "NO" as const,
      drinkingStance: "NO" as const,
      petsStance: "NO" as const,
      introvertExtrovert: 4,
      socialHabits: "HOME_BODY" as const,
      conflictStyle: "TALK_IT_OUT" as const,
      sharedActivities: JSON.stringify(["running", "chess"]),
      bio: "First-year CS. Quiet studier — looking for someone who keeps common spaces tidy.",
      tags: JSON.stringify(["cs", "quiet", "running"]),
    },
    {
      userId: users[4].id,
      displayName: "Eve",
      schoolYear: "SENIOR" as const,
      isFirstYear: false,
      onboardingComplete: true,
      housingType: "OFF_CAMPUS" as const,
      preferredAreas: JSON.stringify(["SHADYSIDE"]),
      dormRanking: "[]",
      roomStylePreferences: "[]",
      budgetMin: 850,
      budgetMax: 1300,
      leaseDuration: "12_MONTHS" as const,
      moveInDate: new Date("2025-08-01"),
      offCampusRoomType: "PRIVATE_ROOM_SHARED_UNIT" as const,
      sleepSchedule: "NIGHT_OWL" as const,
      cleanlinessLevel: 3,
      guestsFrequency: "SOMETIMES" as const,
      studyEnvironment: "SOCIAL" as const,
      noiseTolerance: "HIGH" as const,
      smokingStance: "OK_OUTSIDE" as const,
      drinkingStance: "YES" as const,
      petsStance: "HAVE_PET" as const,
      introvertExtrovert: 8,
      socialHabits: "VERY_SOCIAL" as const,
      conflictStyle: "TALK_IT_OUT" as const,
      sharedActivities: JSON.stringify(["concerts", "travel"]),
      bio: "Design major with a cat. Love hosting and exploring Pittsburgh.",
      tags: JSON.stringify(["design", "cat", "social", "travel"]),
    },
  ];

  for (const p of profileData) {
    await prisma.profile.upsert({
      where: { userId: p.userId },
      create: p,
      update: p,
    });
  }

  const profiles = await prisma.profile.findMany({ where: { userId: { in: users.map((u) => u.id) } } });
  const defaultPrefs = [
    { category: "CLEANLINESS", value: "3", strength: 7, dealbreaker: false },
    { category: "SLEEP_SCHEDULE", value: "FLEXIBLE", strength: 5, dealbreaker: false },
    { category: "GUESTS", value: "SOMETIMES", strength: 5, dealbreaker: false },
    { category: "NOISE_TOLERANCE", value: "MEDIUM", strength: 5, dealbreaker: false },
    { category: "SMOKING", value: "NO", strength: 8, dealbreaker: true },
    { category: "PETS", value: "NO", strength: 6, dealbreaker: false },
    { category: "BUDGET", value: "OVERLAP", strength: 8, dealbreaker: true },
    { category: "ROOM_STYLE", value: "OVERLAP", strength: 6, dealbreaker: false },
  ];

  for (const profile of profiles) {
    const off = profile.housingType === "OFF_CAMPUS";
    for (const pref of defaultPrefs) {
      let p = { ...pref };
      if (pref.category === "BUDGET") {
        p = { ...p, value: off ? "OVERLAP" : "N_A", dealbreaker: off, strength: off ? 8 : 3 };
      }
      if (pref.category === "ROOM_STYLE" && profile.housingType === "ON_CAMPUS") {
        p = { ...p, strength: 7 };
      }
      await prisma.preference.upsert({
        where: { profileId_category: { profileId: profile.id, category: pref.category } },
        create: { profileId: profile.id, ...p },
        update: p,
      });
    }
  }

  console.log(
    "Seed complete. Sample users: alice@cmu.edu, bob@cmu.edu, carol@cmu.edu, dave@cmu.edu, eve@cmu.edu (password: password123)"
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
