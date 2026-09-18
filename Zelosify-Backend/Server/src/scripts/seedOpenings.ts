import prisma from "../config/prisma/prisma.js";

const TENANT_NAME = "Bruce Wayne Corp";

const openings = [
  {
    title: "Senior Backend Engineer",
    description:
      "Build and maintain multi tenant Node.js services with PostgreSQL and AWS. Ownership of API design, performance tuning and secure file handling.",
    location: "Bangalore",
    contractType: "Full Time Contract",
    requiredSkills: ["node.js", "typescript", "postgresql", "aws", "rest"],
    experienceMin: 5,
    experienceMax: 9,
  },
  {
    title: "Frontend Engineer",
    description:
      "Develop dashboard experiences in Next.js with Redux Toolkit, responsive layouts and dark mode support.",
    location: "Remote",
    contractType: "Full Time Contract",
    requiredSkills: ["react", "next.js", "javascript", "redux", "css"],
    experienceMin: 3,
    experienceMax: 6,
  },
  {
    title: "DevOps Engineer",
    description:
      "Own CI/CD pipelines, container orchestration and infrastructure as code for the platform teams.",
    location: "Hyderabad",
    contractType: "Contract to Hire",
    requiredSkills: ["docker", "kubernetes", "terraform", "ci/cd", "aws"],
    experienceMin: 4,
    experienceMax: 8,
  },
  {
    title: "Data Engineer",
    description:
      "Design batch and streaming pipelines, manage warehouse models and keep data quality checks green.",
    location: "Pune",
    contractType: "Full Time Contract",
    requiredSkills: ["python", "spark", "airflow", "sql", "aws"],
    experienceMin: 3,
    experienceMax: 7,
  },
  {
    title: "QA Automation Engineer",
    description:
      "Write end to end and regression suites, maintain test data and report coverage for every release.",
    location: "Chennai",
    contractType: "Part Time Contract",
    requiredSkills: ["selenium", "javascript", "cypress", "ci/cd"],
    experienceMin: 2,
    experienceMax: 5,
  },
  {
    title: "Cloud Security Analyst",
    description:
      "Review cloud posture, run threat modelling sessions and drive remediation with engineering teams.",
    location: "Remote",
    contractType: "Contract to Hire",
    requiredSkills: ["aws", "security", "oauth", "linux"],
    experienceMin: 4,
    experienceMax: null,
  },
  {
    title: "Machine Learning Engineer",
    description:
      "Build feature pipelines, train ranking models and ship inference services with clear evaluation metrics.",
    location: "Bangalore",
    contractType: "Full Time Contract",
    requiredSkills: ["python", "machine learning", "pytorch", "pandas", "aws"],
    experienceMin: 3,
    experienceMax: 8,
  },
  {
    title: "Java Microservices Developer",
    description:
      "Deliver Spring Boot microservices with event driven integration and strong test coverage.",
    location: "Mumbai",
    contractType: "Full Time Contract",
    requiredSkills: ["java", "spring boot", "kafka", "microservices", "sql"],
    experienceMin: 6,
    experienceMax: 12,
  },
  {
    title: "Mobile Application Developer",
    description:
      "Build cross platform mobile screens, integrate REST services and keep release pipelines healthy.",
    location: "Kochi",
    contractType: "Part Time Contract",
    requiredSkills: ["react", "javascript", "rest", "git"],
    experienceMin: 2,
    experienceMax: 5,
  },
  {
    title: "Platform SRE",
    description:
      "Keep production reliable through observability, incident response and capacity planning.",
    location: "Remote",
    contractType: "Contract to Hire",
    requiredSkills: ["kubernetes", "linux", "docker", "ci/cd", "nginx"],
    experienceMin: 5,
    experienceMax: 10,
  },
  {
    title: "Business Intelligence Analyst",
    description:
      "Model reporting datasets, publish dashboards and partner with finance on monthly reviews.",
    location: "Noida",
    contractType: "Full Time Contract",
    requiredSkills: ["sql", "power bi", "tableau", "python"],
    experienceMin: 2,
    experienceMax: 6,
  },
  {
    title: "Solution Architect",
    description:
      "Own solution blueprints across integration, security and scalability for enterprise rollouts.",
    location: "Hyderabad",
    contractType: "Full Time Contract",
    requiredSkills: ["microservices", "aws", "kubernetes", "postgresql", "security"],
    experienceMin: 8,
    experienceMax: null,
  },
];

const getTenant = async () => {
  const existing = await prisma.tenants.findFirst({
    where: { companyName: TENANT_NAME },
  });

  if (existing) return existing;

  return prisma.tenants.create({ data: { companyName: TENANT_NAME } });
};

const getHiringManager = async (tenantId: string) => {
  const registered = await prisma.user.findFirst({
    where: { tenantId, role: "HIRING_MANAGER", externalId: { not: null } },
    orderBy: { createdAt: "asc" },
  });

  if (registered) return { manager: registered, created: false };

  const existingPlaceholder = await prisma.user.findFirst({
    where: { tenantId, role: "HIRING_MANAGER" },
    orderBy: { createdAt: "asc" },
  });

  if (existingPlaceholder) return { manager: existingPlaceholder, created: true };

  const placeholder = await prisma.user.create({
    data: {
      username: "bruce.wayne",
      email: "bruce.wayne@brucewaynecorp.com",
      firstName: "Bruce",
      lastName: "Wayne",
      department: "Engineering",
      role: "HIRING_MANAGER",
      tenantId,
    },
  });

  return { manager: placeholder, created: true };
};

const seedOpenings = async () => {
  try {
    console.log("Seeding openings data...");

    const tenant = await getTenant();
    const { manager, created } = await getHiringManager(tenant.tenantId);

    const existingCount = await prisma.opening.count({
      where: { tenantId: tenant.tenantId },
    });

    if (existingCount > 0) {
      console.log(
        `Tenant already has ${existingCount} openings, reassigning them to ${manager.username}`
      );
      await prisma.opening.updateMany({
        where: { tenantId: tenant.tenantId },
        data: { hiringManagerId: manager.id },
      });
    } else {
      await prisma.$transaction(
        openings.map((opening, index) =>
          prisma.opening.create({
            data: {
              ...opening,
              tenantId: tenant.tenantId,
              hiringManagerId: manager.id,
              expectedCompletionDate: new Date(
                Date.now() + (index + 3) * 7 * 24 * 60 * 60 * 1000
              ),
            },
          })
        )
      );
      console.log(`Created ${openings.length} openings for ${TENANT_NAME}`);
    }

    console.log(`Tenant id: ${tenant.tenantId}`);
    console.log(`Hiring manager id: ${manager.id}`);

    if (created) {
      console.log(
        "A placeholder hiring manager was created because the tenant had none."
      );
      console.log(
        "Register a real HIRING_MANAGER for this tenant and run the seed again to hand the openings over."
      );
    }
  } catch (error) {
    console.error("Error seeding openings:", error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
};

seedOpenings();
