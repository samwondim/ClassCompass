import { SignJWT } from 'jose';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Mint a session cookie value for a given tg_username so we can test the
// authenticated pages without going through the Telegram initData handshake.
async function main() {
  const tgUsername = process.argv[2] || 'admin';
  const user = await prisma.user.findUnique({ where: { tg_username: tgUsername } });

  if (!user) {
    console.error(`User with tg_username "${tgUsername}" not found.`);
    process.exit(1);
  }

  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    console.error('JWT_SECRET not set or too short.');
    process.exit(1);
  }

  const fetched_user = {
    user_role: user.user_role,
    first_name: user.first_name,
    last_name: user.last_name,
    tg_username: user.tg_username,
    user_id: user.user_id,
    tg_id: user.tg_id,
    photo_url: user.photo_url,
  };

  const expires = new Date(Date.now() + 60 * 60 * 1000);
  const key = new TextEncoder().encode(secret);
  const session = await new SignJWT({ fetched_user, expires })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(key);

  console.log(session);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
