import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Создание ролей
  const roles = [
    {
      name: 'ADMIN',
      description: 'Администратор системы',
      permissions: ['*'],
    },
    {
      name: 'PRODUCTION_MANAGER',
      description: 'Руководитель производства',
      permissions: ['production.*', 'reports.production.*'],
    },
    {
      name: 'WAREHOUSE_MANAGER',
      description: 'Кладовщик / Снабженец',
      permissions: ['inventory.*', 'materials.*', 'reports.stock.*'],
    },
    {
      name: 'TECHNOLOGIST',
      description: 'Технолог',
      permissions: ['recipes.*'],
    },
    {
      name: 'SERVICE_MANAGER',
      description: 'Менеджер по сервису',
      permissions: ['service-orders.*', 'reports.service.*'],
    },
    {
      name: 'ENGINEER',
      description: 'Инженер-наладчик',
      permissions: ['service-orders.read', 'work-logs.*'],
    },
    {
      name: 'ACCOUNTANT',
      description: 'Бухгалтер / Финансист',
      permissions: ['reports.*'],
    },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: role,
    });
  }

  console.log('✅ Roles created');

  // Создание администратора
  const adminRole = await prisma.role.findUnique({
    where: { name: 'ADMIN' },
  });

  if (!adminRole) {
    throw new Error('Admin role not found');
  }

  const passwordHash = await bcrypt.hash('admin123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@smtmax.com' },
    update: {},
    create: {
      email: 'admin@smtmax.com',
      passwordHash,
      firstName: 'Admin',
      lastName: 'User',
      phone: '+7 (999) 123-45-67',
      isActive: true,
    },
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: admin.id,
        roleId: adminRole.id,
      },
    },
    update: {},
    create: {
      userId: admin.id,
      roleId: adminRole.id,
    },
  });

  console.log('✅ Admin user created: admin@smtmax.com / admin123');
  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
