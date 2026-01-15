import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ============================================
  // 1. РОЛИ
  // ============================================
  console.log('📝 Creating roles...');

  const roles = [
    {
      name: 'ADMIN',
      description: 'Администратор системы',
      permissions: ['*'],
    },
    {
      name: 'PRODUCTION_MANAGER',
      description: 'Менеджер по производству',
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

  // ============================================
  // 2. ПОЛЬЗОВАТЕЛИ
  // ============================================
  console.log('👥 Creating users...');

  const users = [
    {
      email: 'admin@smtmax.ru',
      password: '123456',
      firstName: 'Иван',
      lastName: 'Петров',
      phone: '+7 (999) 123-45-67',
      roles: ['ADMIN', 'PRODUCTION_MANAGER'],
    },
    {
      email: 'manager@smtmax.ru',
      password: '123456',
      firstName: 'Мария',
      lastName: 'Иванова',
      phone: '+7 (999) 234-56-78',
      roles: ['PRODUCTION_MANAGER'],
    },
    {
      email: 'warehouse@smtmax.ru',
      password: '123456',
      firstName: 'Пётр',
      lastName: 'Сидоров',
      phone: '+7 (999) 345-67-89',
      roles: ['WAREHOUSE_MANAGER'],
    },
    {
      email: 'technologist@smtmax.ru',
      password: '123456',
      firstName: 'Анна',
      lastName: 'Технолог',
      phone: '+7 (999) 456-78-90',
      roles: ['TECHNOLOGIST'],
    },
    {
      email: 'service@smtmax.ru',
      password: '123456',
      firstName: 'Сергей',
      lastName: 'Сервисов',
      phone: '+7 (999) 567-89-01',
      roles: ['SERVICE_MANAGER'],
    },
    {
      email: 'engineer@smtmax.ru',
      password: '123456',
      firstName: 'Алексей',
      lastName: 'Инженеров',
      phone: '+7 (999) 678-90-12',
      roles: ['ENGINEER'],
    },
  ];

  for (const userData of users) {
    const passwordHash = await bcrypt.hash(userData.password, 10);

    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: {
        email: userData.email,
        passwordHash,
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: userData.phone,
        isActive: true,
      },
    });

    // Назначение ролей
    for (const roleName of userData.roles) {
      const role = await prisma.role.findUnique({
        where: { name: roleName },
      });

      if (role) {
        await prisma.userRole.upsert({
          where: {
            userId_roleId: {
              userId: user.id,
              roleId: role.id,
            },
          },
          update: {},
          create: {
            userId: user.id,
            roleId: role.id,
          },
        });
      }
    }
  }

  console.log('✅ Users created');

  // ============================================
  // 3. КОНТРАГЕНТЫ
  // ============================================
  console.log('🏢 Creating contractors...');

  const contractors = [
    {
      name: 'ООО "МеталлТорг"',
      type: 'SUPPLIER',
      inn: '7701234567',
      kpp: '770101001',
      address: 'г. Москва, ул. Промышленная, д. 10',
      phone: '+7 (495) 123-45-67',
      email: 'info@metalltorg.ru',
      contactPerson: 'Иванов Иван Иванович',
      isActive: true,
    },
    {
      name: 'ООО "Электроника"',
      type: 'CUSTOMER',
      inn: '7702345678',
      kpp: '770201001',
      address: 'г. Москва, ул. Электронная, д. 5',
      phone: '+7 (495) 234-56-78',
      email: 'order@elektronika.ru',
      contactPerson: 'Петров Пётр Петрович',
      isActive: true,
    },
    {
      name: 'ООО "ХимПром"',
      type: 'SUPPLIER',
      inn: '7703456789',
      kpp: '770301001',
      address: 'г. Москва, ул. Химическая, д. 15',
      phone: '+7 (495) 345-67-89',
      email: 'sales@himprom.ru',
      contactPerson: 'Сидорова Мария Ивановна',
      isActive: true,
    },
  ];

  for (const contractor of contractors) {
    await prisma.contractor.upsert({
      where: { id: contractors.indexOf(contractor) + 1 },
      update: {},
      create: contractor,
    });
  }

  console.log('✅ Contractors created');

  // ============================================
  // 4. МАТЕРИАЛЫ
  // ============================================
  console.log('📦 Creating materials...');

  const materials = [
    {
      name: 'Олово (Sn)',
      code: 'MAT-001',
      category: 'RAW_MATERIAL',
      unit: 'kg',
      minStock: 10,
      description: 'Олово высокой чистоты для паяльной пасты',
      isActive: true,
    },
    {
      name: 'Свинец (Pb)',
      code: 'MAT-002',
      category: 'RAW_MATERIAL',
      unit: 'kg',
      minStock: 5,
      description: 'Свинец для паяльной пасты',
      isActive: true,
    },
    {
      name: 'Флюс RMA',
      code: 'MAT-003',
      category: 'RAW_MATERIAL',
      unit: 'l',
      minStock: 2,
      description: 'Флюс RMA для паяльной пасты',
      isActive: true,
    },
    {
      name: 'Активатор А-1',
      code: 'MAT-004',
      category: 'RAW_MATERIAL',
      unit: 'l',
      minStock: 1,
      description: 'Активатор для флюса',
      isActive: true,
    },
    {
      name: 'Упаковка картонная',
      code: 'MAT-005',
      category: 'COMPONENT',
      unit: 'pcs',
      minStock: 100,
      description: 'Картонная упаковка для готовой продукции',
      isActive: true,
    },
  ];

  for (const material of materials) {
    await prisma.material.upsert({
      where: { code: material.code },
      update: {},
      create: material,
    });
  }

  console.log('✅ Materials created');

  // ============================================
  // 5. СКЛАДСКИЕ ПОЗИЦИИ
  // ============================================
  console.log('📊 Creating stock items...');

  const supplier = await prisma.contractor.findFirst({
    where: { type: 'SUPPLIER' },
  });

  const stockItems = [
    {
      materialId: 1,
      lotNumber: 'SN-2026-001',
      quantity: 30,
      unit: 'kg',
      expiryDate: new Date('2027-01-01'),
      supplierId: supplier?.id,
      receivedDate: new Date('2026-01-05'),
    },
    {
      materialId: 1,
      lotNumber: 'SN-2026-002',
      quantity: 20,
      unit: 'kg',
      expiryDate: new Date('2027-02-01'),
      supplierId: supplier?.id,
      receivedDate: new Date('2026-01-10'),
    },
    {
      materialId: 2,
      lotNumber: 'PB-2026-001',
      quantity: 25,
      unit: 'kg',
      expiryDate: new Date('2027-01-01'),
      supplierId: supplier?.id,
      receivedDate: new Date('2026-01-05'),
    },
    {
      materialId: 3,
      lotNumber: 'FLUX-2026-001',
      quantity: 10,
      unit: 'l',
      expiryDate: new Date('2026-12-01'),
      supplierId: supplier?.id,
      receivedDate: new Date('2026-01-05'),
    },
    {
      materialId: 4,
      lotNumber: 'ACT-2026-001',
      quantity: 5,
      unit: 'l',
      expiryDate: new Date('2026-12-01'),
      supplierId: supplier?.id,
      receivedDate: new Date('2026-01-05'),
    },
    {
      materialId: 5,
      lotNumber: 'BOX-2026-001',
      quantity: 250,
      unit: 'pcs',
      supplierId: supplier?.id,
      receivedDate: new Date('2026-01-05'),
    },
  ];

  for (const stockItem of stockItems) {
    const item = await prisma.stockItem.create({
      data: stockItem,
    });

    // Создаем движение RECEIPT
    await prisma.stockMovement.create({
      data: {
        materialId: stockItem.materialId,
        stockItemId: item.id,
        movementType: 'RECEIPT',
        quantity: stockItem.quantity,
        unit: stockItem.unit,
        documentNumber: stockItem.lotNumber,
        notes: `Поступление от поставщика`,
      },
    });
  }

  console.log('✅ Stock items created');

  // ============================================
  // 6. РЕЦЕПТУРЫ
  // ============================================
  console.log('📋 Creating recipes...');

  const recipe1 = await prisma.recipe.upsert({
    where: { code: 'PP-001' },
    update: {},
    create: {
      name: 'Паяльная паста ПП-1',
      code: 'PP-001',
      description: 'Стандартная паяльная паста для SMT монтажа',
      version: '1.0',
      isActive: true,
    },
  });

  // Ингредиенты для рецептуры 1
  await prisma.recipeIngredient.createMany({
    data: [
      {
        recipeId: recipe1.id,
        materialId: 1,
        quantity: 60,
        unit: 'kg',
      },
      {
        recipeId: recipe1.id,
        materialId: 2,
        quantity: 40,
        unit: 'kg',
      },
      {
        recipeId: recipe1.id,
        materialId: 3,
        quantity: 5,
        unit: 'l',
      },
    ],
    skipDuplicates: true,
  });

  // Параметры для рецептуры 1
  await prisma.recipeParameter.createMany({
    data: [
      {
        recipeId: recipe1.id,
        name: 'Температура смешивания',
        value: '25',
        unit: '°C',
        minValue: 20,
        maxValue: 30,
      },
      {
        recipeId: recipe1.id,
        name: 'Влажность',
        value: '45',
        unit: '%',
        minValue: 40,
        maxValue: 60,
      },
      {
        recipeId: recipe1.id,
        name: 'Время перемешивания',
        value: '15',
        unit: 'мин',
        minValue: 10,
        maxValue: 20,
      },
    ],
    skipDuplicates: true,
  });

  const recipe2 = await prisma.recipe.upsert({
    where: { code: 'PP-002' },
    update: {},
    create: {
      name: 'Паяльная паста ПП-2',
      code: 'PP-002',
      description: 'Паста с низкой температурой плавления',
      version: '2.1',
      isActive: true,
    },
  });

  const recipe3 = await prisma.recipe.upsert({
    where: { code: 'PP-003' },
    update: {},
    create: {
      name: 'Паяльная паста ПП-3 (устаревшая)',
      code: 'PP-003',
      description: 'Старая версия, не используется',
      version: '1.0',
      isActive: false,
    },
  });

  console.log('✅ Recipes created');

  // ============================================
  // 7. ПРОИЗВОДСТВЕННЫЕ ЗАКАЗЫ
  // ============================================
  console.log('🏭 Creating production orders...');

  const order1 = await prisma.productionOrder.upsert({
    where: { orderNumber: 'ORD-2026-001' },
    update: {},
    create: {
      orderNumber: 'ORD-2026-001',
      recipeId: recipe1.id,
      plannedQty: 500,
      unit: 'kg',
      status: 'IN_PROGRESS',
      plannedDate: new Date('2026-01-10T08:00:00Z'),
      deadline: new Date('2026-01-20T18:00:00Z'),
      notes: 'Срочный заказ для клиента ООО "Электроника"',
    },
  });

  const order2 = await prisma.productionOrder.upsert({
    where: { orderNumber: 'ORD-2026-002' },
    update: {},
    create: {
      orderNumber: 'ORD-2026-002',
      recipeId: recipe2.id,
      plannedQty: 300,
      unit: 'kg',
      status: 'PLANNED',
      plannedDate: new Date('2026-01-18T08:00:00Z'),
      deadline: new Date('2026-01-25T18:00:00Z'),
    },
  });

  const order3 = await prisma.productionOrder.upsert({
    where: { orderNumber: 'ORD-2026-003' },
    update: {},
    create: {
      orderNumber: 'ORD-2026-003',
      recipeId: recipe1.id,
      plannedQty: 200,
      unit: 'kg',
      status: 'COMPLETED',
      plannedDate: new Date('2026-01-05T08:00:00Z'),
      deadline: new Date('2026-01-10T18:00:00Z'),
    },
  });

  console.log('✅ Production orders created');

  // ============================================
  // 8. ПРОИЗВОДСТВЕННЫЕ ПАРТИИ
  // ============================================
  console.log('📦 Creating production batches...');

  const adminUser = await prisma.user.findUnique({
    where: { email: 'admin@smtmax.ru' },
  });

  const managerUser = await prisma.user.findUnique({
    where: { email: 'manager@smtmax.ru' },
  });

  if (adminUser) {
    const batch1 = await prisma.productionBatch.upsert({
      where: { batchNumber: 'BATCH-2026-001' },
      update: {},
      create: {
        batchNumber: 'BATCH-2026-001',
        orderId: order1.id,
        recipeId: recipe1.id,
        producedQty: 100,
        unit: 'kg',
        productionDate: new Date('2026-01-12T10:00:00Z'),
        producedBy: adminUser.id,
        status: 'COMPLETED',
      },
    });

    // Параметры партии
    await prisma.batchParameter.createMany({
      data: [
        {
          batchId: batch1.id,
          name: 'Температура смешивания',
          value: '25',
          unit: '°C',
          isInRange: true,
        },
        {
          batchId: batch1.id,
          name: 'Влажность',
          value: '48',
          unit: '%',
          isInRange: true,
        },
        {
          batchId: batch1.id,
          name: 'Время перемешивания',
          value: '18',
          unit: 'мин',
          isInRange: true,
        },
      ],
      skipDuplicates: true,
    });

    // Использование материалов
    await prisma.materialUsage.createMany({
      data: [
        {
          batchId: batch1.id,
          materialId: 1,
          quantity: 60,
          unit: 'kg',
        },
        {
          batchId: batch1.id,
          materialId: 2,
          quantity: 40,
          unit: 'kg',
        },
      ],
      skipDuplicates: true,
    });

    const batch2 = await prisma.productionBatch.upsert({
      where: { batchNumber: 'BATCH-2026-002' },
      update: {},
      create: {
        batchNumber: 'BATCH-2026-002',
        orderId: order1.id,
        recipeId: recipe1.id,
        producedQty: 150,
        unit: 'kg',
        productionDate: new Date('2026-01-14T10:00:00Z'),
        producedBy: adminUser.id,
        status: 'COMPLETED',
      },
    });

    if (managerUser) {
      const batch3 = await prisma.productionBatch.upsert({
        where: { batchNumber: 'BATCH-2026-003' },
        update: {},
        create: {
          batchNumber: 'BATCH-2026-003',
          orderId: order1.id,
          recipeId: recipe1.id,
          producedQty: 100,
          unit: 'kg',
          productionDate: new Date('2026-01-15T10:00:00Z'),
          producedBy: managerUser.id,
          status: 'IN_PROGRESS',
        },
      });
    }
  }

  console.log('✅ Production batches created');

  // ============================================
  // 9. СЕРВИСНЫЕ ЗАКАЗЫ
  // ============================================
  console.log('🔧 Creating service orders...');

  const customer = await prisma.contractor.findFirst({
    where: { type: 'CUSTOMER' },
  });

  if (customer) {
    const serviceOrder1 = await prisma.serviceOrder.upsert({
      where: { orderNumber: 'SO-2026-001' },
      update: {},
      create: {
        orderNumber: 'SO-2026-001',
        customerId: customer.id,
        equipmentType: 'Линия SMT',
        equipmentModel: 'Yamaha YSM20',
        location: 'г. Москва, завод "Электроника"',
        description: 'Пусконаладка линии SMT',
        plannedStart: new Date('2026-01-20T09:00:00Z'),
        plannedEnd: new Date('2026-01-25T18:00:00Z'),
        status: 'PLANNED',
        priority: 'HIGH',
      },
    });

    const serviceOrder2 = await prisma.serviceOrder.upsert({
      where: { orderNumber: 'SO-2026-002' },
      update: {},
      create: {
        orderNumber: 'SO-2026-002',
        customerId: customer.id,
        equipmentType: 'Печь оплавления',
        equipmentModel: 'BTU Pyramax',
        location: 'г. Санкт-Петербург, завод "Микроэлектроника"',
        description: 'Калибровка температурного профиля',
        plannedStart: new Date('2026-01-18T09:00:00Z'),
        plannedEnd: new Date('2026-01-19T18:00:00Z'),
        status: 'IN_PROGRESS',
        priority: 'MEDIUM',
        actualStart: new Date('2026-01-18T09:30:00Z'),
      },
    });

    // Назначение инженера
    const engineer = await prisma.user.findUnique({
      where: { email: 'engineer@smtmax.ru' },
    });

    if (engineer) {
      await prisma.serviceAssignment.create({
        data: {
          orderId: serviceOrder2.id,
          engineerId: engineer.id,
          notes: 'Основной инженер на объекте',
        },
      });

      // Журнал работ
      await prisma.workLog.create({
        data: {
          orderId: serviceOrder2.id,
          engineerId: engineer.id,
          workDate: new Date('2026-01-18'),
          startTime: new Date('2026-01-18T09:30:00Z'),
          endTime: new Date('2026-01-18T18:00:00Z'),
          description: 'Выполнена калибровка температурного профиля печи',
          result: 'Калибровка завершена успешно, профиль соответствует требованиям',
          status: 'COMPLETED',
        },
      });
    }
  }

  console.log('✅ Service orders created');

  // ============================================
  // 10. ИНВЕНТАРИЗАЦИЯ
  // ============================================
  console.log('📝 Creating inventory checks...');

  const inventoryCheck = await prisma.inventoryCheck.upsert({
    where: { checkNumber: 'INV-2026-001' },
    update: {},
    create: {
      checkNumber: 'INV-2026-001',
      checkDate: new Date('2026-01-10T10:00:00Z'),
      status: 'COMPLETED',
      notes: 'Плановая инвентаризация',
    },
  });

  await prisma.inventoryCheckItem.createMany({
    data: [
      {
        checkId: inventoryCheck.id,
        materialId: 1,
        systemQty: 50,
        actualQty: 50,
        difference: 0,
        unit: 'kg',
      },
      {
        checkId: inventoryCheck.id,
        materialId: 2,
        systemQty: 25,
        actualQty: 25,
        difference: 0,
        unit: 'kg',
      },
      {
        checkId: inventoryCheck.id,
        materialId: 3,
        systemQty: 10,
        actualQty: 12,
        difference: 2,
        unit: 'l',
        notes: 'Излишки',
      },
    ],
    skipDuplicates: true,
  });

  console.log('✅ Inventory checks created');

  console.log('');
  console.log('🎉 Seeding completed successfully!');
  console.log('');
  console.log('📋 Created accounts:');
  console.log('   Admin:        admin@smtmax.ru / 123456');
  console.log('   Manager:      manager@smtmax.ru / 123456');
  console.log('   Warehouse:    warehouse@smtmax.ru / 123456');
  console.log('   Technologist: technologist@smtmax.ru / 123456');
  console.log('   Service:      service@smtmax.ru / 123456');
  console.log('   Engineer:     engineer@smtmax.ru / 123456');
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
