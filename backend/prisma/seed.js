import { PrismaClient, Role } from '@prisma/client';
import argon2 from 'argon2';
const prisma = new PrismaClient();
async function main() {
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;
    if (!email || !password) {
        console.log('Seed skipped: set ADMIN_EMAIL and ADMIN_PASSWORD in .env to create an admin user.');
        return;
    }
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
        console.log('Seed skipped: user with this email already exists.');
        return;
    }
    const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
    await prisma.user.create({
        data: {
            email,
            passwordHash,
            role: Role.admin,
        },
    });
    console.log(`Created admin user: ${email}`);
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
