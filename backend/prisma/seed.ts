import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash("password123", 10);

  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: "alice@cmu.edu" },
      create: { email: "alice@cmu.edu", passwordHash: hash },
      update: {},
    }),
    prisma.user.upsert({
      where: { email: "bob@cmu.edu" },
      create: { email: "bob@cmu.edu", passwordHash: hash },
      update: {},
    }),
    prisma.user.upsert({
      where: { email: "carol@cmu.edu" },
      create: { email: "carol@cmu.edu", passwordHash: hash },
      update: {},
    }),
    prisma.user.upsert({
      where: { email: "dave@cmu.edu" },
      create: { email: "dave@cmu.edu", passwordHash: hash },
      update: {},
    }),
    prisma.user.upsert({
      where: { email: "eve@cmu.edu" },
      create: { email: "eve@cmu.edu", passwordHash: hash },
      update: {},
    }),
  ]);

  const profileData = [
    {
      userId: users[0].id,
      onboardingComplete: true,
      housingType: "OFF_CAMPUS",
      preferredAreas: ["Squirrel Hill", "Shadyside"],
      budgetMin: 800,
      budgetMax: 1200,
      leaseDuration: "12_MONTHS",
      moveInDate: new Date("2025-08-01"),
      sleepSchedule: "EARLY_BIRD",
      cleanlinessLevel: 4,
      guestsFrequency: "SOMETIMES",
      studyEnvironment: "QUIET",
      noiseTolerance: "LOW",
      smokingStance: "NO",
      drinkingStance: "OCCASIONAL",
      petsStance: "NO",
      introvertExtrovert: 6,
      socialHabits: "BALANCED",
      conflictStyle: "TALK_IT_OUT",
      sharedActivities: ["hiking", "cooking"],
      bio: "CMU grad student, quiet and clean. Love morning coffee and weekend hikes.",
      tags: ["grad", "quiet", "hiking", "cooking"],
    },
    {
      userId: users[1].id,
      onboardingComplete: true,
      housingType: "OFF_CAMPUS",
      preferredAreas: ["Shadyside", "Oakland"],
      budgetMin: 700,
      budgetMax: 1100,
      leaseDuration: "12_MONTHS",
      moveInDate: new Date("2025-08-15"),
      sleepSchedule: "NIGHT_OWL",
      cleanlinessLevel: 3,
      guestsFrequency: "OFTEN",
      studyEnvironment: "MODERATE",
      noiseTolerance: "MEDIUM",
      smokingStance: "NO",
      drinkingStance: "YES",
      petsStance: "NO",
      introvertExtrovert: 7,
      socialHabits: "VERY_SOCIAL",
      conflictStyle: "TALK_IT_OUT",
      sharedActivities: ["movies", "gaming"],
      bio: "CS undergrad, love hosting friends. Down for movie nights and study sessions.",
      tags: ["cs", "social", "gaming", "movies"],
    },
    {
      userId: users[2].id,
      onboardingComplete: true,
      housingType: "ON_CAMPUS",
      preferredAreas: ["Oakland"],
      budgetMin: 600,
      budgetMax: 900,
      leaseDuration: "9_MONTHS",
      moveInDate: new Date("2025-08-01"),
      sleepSchedule: "EARLY_BIRD",
      cleanlinessLevel: 5,
      guestsFrequency: "RARELY",
      studyEnvironment: "QUIET",
      noiseTolerance: "LOW",
      smokingStance: "NO",
      drinkingStance: "NO",
      petsStance: "NO",
      introvertExtrovert: 3,
      socialHabits: "HOME_BODY",
      conflictStyle: "AVOID",
      sharedActivities: ["reading", "yoga"],
      bio: "Pre-med, need a calm and clean space. Early to bed, early to rise.",
      tags: ["premed", "quiet", "clean", "yoga"],
    },
    {
      userId: users[3].id,
      onboardingComplete: true,
      housingType: "OFF_CAMPUS",
      preferredAreas: ["Squirrel Hill", "Shadyside", "Oakland"],
      budgetMin: 750,
      budgetMax: 1150,
      leaseDuration: "12_MONTHS",
      moveInDate: new Date("2025-09-01"),
      sleepSchedule: "FLEXIBLE",
      cleanlinessLevel: 4,
      guestsFrequency: "SOMETIMES",
      studyEnvironment: "MODERATE",
      noiseTolerance: "MEDIUM",
      smokingStance: "NO",
      drinkingStance: "OCCASIONAL",
      petsStance: "YES",
      introvertExtrovert: 5,
      socialHabits: "BALANCED",
      conflictStyle: "MEDIATE",
      sharedActivities: ["cooking", "hiking", "movies"],
      bio: "ECE senior. Flexible schedule, love cooking and the outdoors.",
      tags: ["ece", "cooking", "hiking", "flexible"],
    },
    {
      userId: users[4].id,
      onboardingComplete: true,
      housingType: "OFF_CAMPUS",
      preferredAreas: ["Shadyside"],
      budgetMin: 850,
      budgetMax: 1300,
      leaseDuration: "12_MONTHS",
      moveInDate: new Date("2025-08-01"),
      sleepSchedule: "NIGHT_OWL",
      cleanlinessLevel: 3,
      guestsFrequency: "SOMETIMES",
      studyEnvironment: "SOCIAL",
      noiseTolerance: "HIGH",
      smokingStance: "OK_OUTSIDE",
      drinkingStance: "YES",
      petsStance: "HAVE_PET",
      introvertExtrovert: 8,
      socialHabits: "VERY_SOCIAL",
      conflictStyle: "TALK_IT_OUT",
      sharedActivities: ["parties", "concerts", "travel"],
      bio: "Design major with a cat. Love hosting and going out. 420 friendly outside.",
      tags: ["design", "cat", "social", "travel"],
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
    { category: "CLEANLINESS", value: "MODERATE", strength: 7, dealbreaker: false },
    { category: "SLEEP_SCHEDULE", value: "FLEXIBLE", strength: 5, dealbreaker: false },
    { category: "GUESTS", value: "SOMETIMES", strength: 5, dealbreaker: false },
    { category: "NOISE_TOLERANCE", value: "MEDIUM", strength: 5, dealbreaker: false },
    { category: "SMOKING", value: "NO", strength: 8, dealbreaker: true },
    { category: "PETS", value: "NO", strength: 6, dealbreaker: false },
    { category: "BUDGET", value: "OVERLAP", strength: 8, dealbreaker: true },
  ];

  for (const profile of profiles) {
    for (const pref of defaultPrefs) {
      await prisma.preference.upsert({
        where: { profileId_category: { profileId: profile.id, category: pref.category } },
        create: { profileId: profile.id, ...pref },
        update: pref,
      });
    }
  }

  console.log("Seed complete. Sample users: alice@cmu.edu, bob@cmu.edu, carol@cmu.edu, dave@cmu.edu, eve@cmu.edu (password: password123)");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
