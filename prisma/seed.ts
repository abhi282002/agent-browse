import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { DEFAULT_WORKFLOW_SEEDS } from "../server/services/workflowSeedData";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase() || "admin@agentbrowse.com";
  const adminPassword = process.env.ADMIN_PASSWORD?.trim();

  if (!adminPassword) {
    throw new Error(
      "ADMIN_PASSWORD environment variable is missing or empty. Please define ADMIN_PASSWORD in your .env file before running seed."
    );
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(adminPassword, salt);

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: "Admin User",
      role: "admin",
      plan: "pro",
      passwordHash,
      workspaceName: "Admin Central Command",
    },
    create: {
      name: "Admin User",
      email: adminEmail,
      passwordHash,
      role: "admin",
      plan: "pro",
      workspaceName: "Admin Central Command",
    },
  });

  console.log("-----------------------------------------");
  console.log("Admin user seeded successfully!");
  console.log(`ID:        ${adminUser.id}`);
  console.log(`Email:     ${adminUser.email}`);
  console.log("Password:  [Configured securely via ADMIN_PASSWORD in .env]");
  console.log(`Role:      ${adminUser.role}`);
  console.log(`Plan:      ${adminUser.plan}`);
  console.log(`Workspace: ${adminUser.workspaceName}`);
  // Seed default Organization for Admin
  const adminOrg = await prisma.organization.upsert({
    where: { slug: "admin-central-command" },
    update: {
      name: "Admin Central Command",
      description: "Root intelligence workspace for autonomous browser agents.",
      defaultAiModel: "Gemini 2.5 Pro Vision",
    },
    create: {
      name: "Admin Central Command",
      slug: "admin-central-command",
      description: "Root intelligence workspace for autonomous browser agents.",
      defaultAiModel: "Gemini 2.5 Pro Vision",
      aiInstructions: "Execute browser journeys with deterministic data extraction and strict schema validation.",
    },
  });

  // Assign Admin User as Owner of the seeded organization
  await prisma.organizationMember.upsert({
    where: {
      organizationId_userId: {
        organizationId: adminOrg.id,
        userId: adminUser.id,
      },
    },
    update: { role: "owner" },
    create: {
      organizationId: adminOrg.id,
      userId: adminUser.id,
      role: "owner",
    },
  });

  await prisma.user.update({
    where: { id: adminUser.id },
    data: { activeOrgId: adminOrg.id },
  });

  console.log(`Organization: ${adminOrg.name} (${adminOrg.slug})`);
  console.log("-----------------------------------------");

  // Seed default workflow blueprints into PostgreSQL under the organization
  for (const wf of DEFAULT_WORKFLOW_SEEDS) {
    await prisma.workflow.upsert({
      where: { id: wf.id },
      update: {
        name: wf.name,
        description: wf.description,
        category: wf.category,
        targetUrl: wf.targetUrl || "",
        organizationId: adminOrg.id,
        userId: adminUser.id,
        nodes: wf.nodes as any,
        edges: wf.edges as any,
      },
      create: {
        id: wf.id,
        name: wf.name,
        description: wf.description,
        category: wf.category,
        targetUrl: wf.targetUrl || "",
        status: wf.status,
        organizationId: adminOrg.id,
        userId: adminUser.id,
        nodes: wf.nodes as any,
        edges: wf.edges as any,
      },
    });
  }
  console.log(`Seeded ${DEFAULT_WORKFLOW_SEEDS.length} default workflows linked to ${adminOrg.name}.`);
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
