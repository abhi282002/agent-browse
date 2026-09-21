import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

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
  console.log("-----------------------------------------");

  // Seed default workflow blueprints into PostgreSQL
  const { DEFAULT_WORKFLOW_SEEDS } = await import("../server/services/workflowSeedData");
  for (const wf of DEFAULT_WORKFLOW_SEEDS) {
    await prisma.workflow.upsert({
      where: { id: wf.id },
      update: {
        name: wf.name,
        description: wf.description,
        category: wf.category,
        targetUrl: wf.targetUrl || "",
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
        nodes: wf.nodes as any,
        edges: wf.edges as any,
      },
    });
  }
  console.log(`Seeded ${DEFAULT_WORKFLOW_SEEDS.length} default workflows into database.`);
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
