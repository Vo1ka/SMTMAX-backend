import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Объявляем переменные, которые будут использоваться позже
  let allMaterials: any[] = [];
  let recipes: any[] = [];
  let contractors: any[] = [];
  let orders: any[] = [];

  // ============================================
  // 1. РОЛИ (6 ролей)
  // ============================================
  console.log('📝 Creating roles...');

  const roles = [
    { name: 'ADMIN', description: 'Администратор системы', permissions: ['*'] },
    { name: 'PRODUCTION_MANAGER', description: 'Менеджер по производству', permissions: ['production.*', 'reports.*'] },
    { name: 'WAREHOUSE_MANAGER', description: 'Кладовщик / Снабженец', permissions: ['inventory.*', 'materials.*'] },
    { name: 'TECHNOLOGIST', description: 'Технолог', permissions: ['recipes.*'] },
    { name: 'SERVICE_MANAGER', description: 'Менеджер по сервису', permissions: ['service-orders.*'] },
    { name: 'ENGINEER', description: 'Инженер-наладчик', permissions: ['service-orders.read', 'work-logs.*'] },
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
  // 2. ПОЛЬЗОВАТЕЛИ (10 пользователей)
  // ============================================
  console.log('👥 Creating users...');

  const usersData = [
    { email: 'admin@smtmax.ru', password: '123456', firstName: 'Иван', lastName: 'Петров', phone: '+7 (999) 123-45-67', roles: ['ADMIN', 'PRODUCTION_MANAGER'] },
    { email: 'manager@smtmax.ru', password: '123456', firstName: 'Мария', lastName: 'Иванова', phone: '+7 (999) 234-56-78', roles: ['PRODUCTION_MANAGER'] },
    { email: 'warehouse@smtmax.ru', password: '123456', firstName: 'Пётр', lastName: 'Сидоров', phone: '+7 (999) 345-67-89', roles: ['WAREHOUSE_MANAGER'] },
    { email: 'technologist@smtmax.ru', password: '123456', firstName: 'Анна', lastName: 'Технолог', phone: '+7 (999) 456-78-90', roles: ['TECHNOLOGIST'] },
    { email: 'service@smtmax.ru', password: '123456', firstName: 'Сергей', lastName: 'Сервисов', phone: '+7 (999) 567-89-01', roles: ['SERVICE_MANAGER'] },
    { email: 'engineer1@smtmax.ru', password: '123456', firstName: 'Алексей', lastName: 'Инженеров', phone: '+7 (999) 678-90-12', roles: ['ENGINEER'] },
    { email: 'engineer2@smtmax.ru', password: '123456', firstName: 'Дмитрий', lastName: 'Мастеров', phone: '+7 (999) 789-01-23', roles: ['ENGINEER'] },
    { email: 'engineer3@smtmax.ru', password: '123456', firstName: 'Николай', lastName: 'Ремонтов', phone: '+7 (999) 890-12-34', roles: ['ENGINEER'] },
    { email: 'operator1@smtmax.ru', password: '123456', firstName: 'Ольга', lastName: 'Операторова', phone: '+7 (999) 901-23-45', roles: ['PRODUCTION_MANAGER'] },
    { email: 'operator2@smtmax.ru', password: '123456', firstName: 'Елена', lastName: 'Производственная', phone: '+7 (999) 012-34-56', roles: ['PRODUCTION_MANAGER'] },
  ];

  const passwordHash = await bcrypt.hash('123456', 10);

  for (const userData of usersData) {
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

    for (const roleName of userData.roles) {
      const role = await prisma.role.findUnique({ where: { name: roleName } });
      if (role) {
        await prisma.userRole.upsert({
          where: { userId_roleId: { userId: user.id, roleId: role.id } },
          update: {},
          create: { userId: user.id, roleId: role.id },
        });
      }
    }
  }

  console.log('✅ Users created');

  // ============================================
  // 3. КОНТРАГЕНТЫ (12 контрагентов)
  // ============================================
  console.log('🏢 Creating contractors...');

  const contractorsData = [
    // Поставщики
    { name: 'ООО "МеталлТорг"', type: 'SUPPLIER', inn: '7701234567', kpp: '770101001', address: 'г. Москва, ул. Промышленная, д. 10', phone: '+7 (495) 123-45-67', email: 'info@metalltorg.ru', contactPerson: 'Иванов Иван Иванович' },
    { name: 'ООО "ХимПром"', type: 'SUPPLIER', inn: '7703456789', kpp: '770301001', address: 'г. Москва, ул. Химическая, д. 15', phone: '+7 (495) 345-67-89', email: 'sales@himprom.ru', contactPerson: 'Сидорова Мария Ивановна' },
    { name: 'ООО "УпакСервис"', type: 'SUPPLIER', inn: '7705678901', kpp: '770501001', address: 'г. Москва, ул. Складская, д. 20', phone: '+7 (495) 567-89-01', email: 'order@upakservis.ru', contactPerson: 'Петрова Анна Сергеевна' },
    { name: 'ИП Смирнов А.В.', type: 'SUPPLIER', inn: '770789012345', address: 'г. Москва, ул. Торговая, д. 5', phone: '+7 (495) 789-01-23', email: 'smirnov@mail.ru', contactPerson: 'Смирнов Андрей Владимирович' },
    
    // Заказчики
    { name: 'ООО "Электроника"', type: 'CUSTOMER', inn: '7702345678', kpp: '770201001', address: 'г. Москва, ул. Электронная, д. 5', phone: '+7 (495) 234-56-78', email: 'order@elektronika.ru', contactPerson: 'Петров Пётр Петрович' },
    { name: 'АО "ТехноПром"', type: 'CUSTOMER', inn: '7704567890', kpp: '770401001', address: 'г. Санкт-Петербург, пр. Индустриальный, д. 100', phone: '+7 (812) 456-78-90', email: 'zakaz@tehnoprom.ru', contactPerson: 'Кузнецов Игорь Александрович' },
    { name: 'ООО "МикроЧип"', type: 'CUSTOMER', inn: '7706789012', kpp: '770601001', address: 'г. Казань, ул. Производственная, д. 25', phone: '+7 (843) 678-90-12', email: 'info@microchip.ru', contactPerson: 'Васильева Ольга Николаевна' },
    { name: 'ЗАО "ЭлектроМонтаж"', type: 'CUSTOMER', inn: '7708901234', kpp: '770801001', address: 'г. Екатеринбург, ул. Монтажная, д. 50', phone: '+7 (343) 890-12-34', email: 'em@elektromontazh.ru', contactPerson: 'Соколов Дмитрий Викторович' },
    { name: 'ООО "ПромАвтоматика"', type: 'CUSTOMER', inn: '7709012345', kpp: '770901001', address: 'г. Новосибирск, ул. Автоматизации, д. 15', phone: '+7 (383) 901-23-45', email: 'order@promavtomatika.ru', contactPerson: 'Морозова Елена Игоревна' },
    { name: 'АО "ЗаводСпецТех"', type: 'CUSTOMER', inn: '7710123456', kpp: '771001001', address: 'г. Челябинск, ул. Заводская, д. 80', phone: '+7 (351) 012-34-56', email: 'info@zavod-st.ru', contactPerson: 'Федоров Сергей Петрович' },
    { name: 'ООО "ИнноТех"', type: 'CUSTOMER', inn: '7711234567', kpp: '771101001', address: 'г. Ростов-на-Дону, ул. Инновационная, д. 12', phone: '+7 (863) 123-45-67', email: 'sales@innotech.ru', contactPerson: 'Николаева Татьяна Владимировна' },
    { name: 'ЗАО "ЭлектроСистемы"', type: 'CUSTOMER', inn: '7712345678', kpp: '771201001', address: 'г. Уфа, ул. Системная, д. 30', phone: '+7 (347) 234-56-78', email: 'order@electrosystems.ru', contactPerson: 'Алексеев Максим Андреевич' },
  ];

  for (const contractorData of contractorsData) {
    await prisma.contractor.create({ data: { ...contractorData, isActive: true } });
  }

  contractors = await prisma.contractor.findMany();

  console.log('✅ Contractors created');

  // ============================================
  // 4. МАТЕРИАЛЫ (20 материалов)
  // ============================================
  console.log('📦 Creating materials...');

  const materialsData = [
    // RAW_MATERIAL (10 шт)
    { name: 'Олово (Sn)', code: 'MAT-001', category: 'RAW_MATERIAL', unit: 'kg', minStock: 50, description: 'Олово высокой чистоты' },
    { name: 'Свинец (Pb)', code: 'MAT-002', category: 'RAW_MATERIAL', unit: 'kg', minStock: 30, description: 'Свинец технический' },
    { name: 'Серебро (Ag)', code: 'MAT-003', category: 'RAW_MATERIAL', unit: 'kg', minStock: 5, description: 'Серебро для легирования' },
    { name: 'Медь (Cu)', code: 'MAT-004', category: 'RAW_MATERIAL', unit: 'kg', minStock: 20, description: 'Медь электротехническая' },
    { name: 'Флюс RMA', code: 'MAT-005', category: 'RAW_MATERIAL', unit: 'l', minStock: 10, description: 'Флюс RMA для паяльной пасты' },
    { name: 'Флюс No-Clean', code: 'MAT-006', category: 'RAW_MATERIAL', unit: 'l', minStock: 5, description: 'Флюс безотмывочный' },
    { name: 'Активатор А-1', code: 'MAT-007', category: 'RAW_MATERIAL', unit: 'l', minStock: 3, description: 'Активатор для флюса' },
    { name: 'Растворитель ИПС', code: 'MAT-008', category: 'RAW_MATERIAL', unit: 'l', minStock: 15, description: 'Изопропиловый спирт' },
    { name: 'Загуститель', code: 'MAT-009', category: 'RAW_MATERIAL', unit: 'kg', minStock: 5, description: 'Загуститель для пасты' },
    { name: 'Антиоксидант', code: 'MAT-010', category: 'RAW_MATERIAL', unit: 'l', minStock: 2, description: 'Антиоксидант для защиты' },
    
    // COMPONENT (4 шт)
    { name: 'Упаковка картонная 1кг', code: 'MAT-011', category: 'COMPONENT', unit: 'pcs', minStock: 500, description: 'Коробка для пасты 1кг' },
    { name: 'Упаковка картонная 500г', code: 'MAT-012', category: 'COMPONENT', unit: 'pcs', minStock: 300, description: 'Коробка для пасты 500г' },
    { name: 'Банка пластиковая 250г', code: 'MAT-013', category: 'COMPONENT', unit: 'pcs', minStock: 200, description: 'Банка для пасты 250г' },
    { name: 'Этикетка самоклеящаяся', code: 'MAT-014', category: 'COMPONENT', unit: 'pcs', minStock: 1000, description: 'Этикетка с логотипом' },
    
    // SPARE_PART (3 шт)
    { name: 'Фильтр воздушный', code: 'MAT-015', category: 'SPARE_PART', unit: 'pcs', minStock: 10, description: 'Фильтр для оборудования' },
    { name: 'Ремень приводной', code: 'MAT-016', category: 'SPARE_PART', unit: 'pcs', minStock: 5, description: 'Ремень для миксера' },
    { name: 'Подшипник 6205', code: 'MAT-017', category: 'SPARE_PART', unit: 'pcs', minStock: 8, description: 'Подшипник для вала' },
    
    // CONSUMABLE (3 шт)
    { name: 'Перчатки нитриловые', code: 'MAT-018', category: 'COMPONENT', unit: 'pcs', minStock: 100, description: 'Перчатки защитные' },
    { name: 'Салфетки безворсовые', code: 'MAT-019', category: 'COMPONENT', unit: 'pcs', minStock: 50, description: 'Салфетки для очистки' },
    { name: 'Скотч упаковочный', code: 'MAT-020', category: 'COMPONENT', unit: 'pcs', minStock: 20, description: 'Скотч 50мм' },
  ];

  for (const materialData of materialsData) {
    await prisma.material.create({ data: { ...materialData, isActive: true } });
  }

  allMaterials = await prisma.material.findMany();

  console.log('✅ Materials created');

  // ============================================
  // 5. СКЛАДСКИЕ ПОЗИЦИИ (с низкими остатками и истекающими сроками)
  // ============================================
  console.log('📊 Creating stock items...');

  const supplier = await prisma.contractor.findFirst({ where: { type: 'SUPPLIER' } });

  for (const material of allMaterials) {
    const stockCount = Math.floor(Math.random() * 3) + 2; // 2-4 позиции на материал
    
    for (let i = 0; i < stockCount; i++) {
      const minStock = material.minStock ? Number(material.minStock) : 10;
      
      // 30% материалов с низкими остатками
      const isLowStock = Math.random() < 0.3;
      const quantity = isLowStock 
        ? Math.floor(minStock * 0.5) // Ниже минимума
        : Math.floor(minStock * (2 + Math.random() * 3)); // Нормальный остаток
      
      const receivedDate = new Date();
      receivedDate.setDate(receivedDate.getDate() - Math.floor(Math.random() * 60)); // За последние 2 месяца
      
      // Срок годности только для химии
      let expiryDate: Date | null = null;
      if (material.category === 'RAW_MATERIAL' && ['l'].includes(material.unit)) {
        expiryDate = new Date();
        // 20% с истекающим сроком (1-2 месяца)
        if (Math.random() < 0.2) {
          expiryDate.setDate(expiryDate.getDate() + Math.floor(Math.random() * 60) + 30);
        } else {
          expiryDate.setFullYear(expiryDate.getFullYear() + 1);
        }
      }
      
      const stockItem = await prisma.stockItem.create({
        data: {
          materialId: material.id,
          lotNumber: `LOT-${material.code}-${String(i + 1).padStart(3, '0')}`,
          quantity,
          unit: material.unit,
          expiryDate: expiryDate || undefined,
          supplierId: supplier?.id,
          receivedDate,
        },
      });

      // Создаем движение RECEIPT
      await prisma.stockMovement.create({
        data: {
          materialId: material.id,
          stockItemId: stockItem.id,
          movementType: 'RECEIPT',
          quantity,
          unit: material.unit,
          documentNumber: stockItem.lotNumber,
          notes: `Поступление от поставщика`,
        },
      });
    }
  }

  console.log('✅ Stock items created');

  // ============================================
  // 6. РЕЦЕПТУРЫ (7 рецептур)
  // ============================================
  console.log('📋 Creating recipes...');

  const recipesData = [
    { name: 'Паяльная паста SAC305', code: 'RCP-001', description: 'Безсвинцовая паста Sn96.5/Ag3.0/Cu0.5', version: '2.1', isActive: true },
    { name: 'Паяльная паста SnPb63/37', code: 'RCP-002', description: 'Оловянно-свинцовая паста', version: '1.5', isActive: true },
    { name: 'Паяльная паста SAC387', code: 'RCP-003', description: 'Безсвинцовая паста Sn95.5/Ag3.8/Cu0.7', version: '1.0', isActive: true },
    { name: 'Паяльная паста Low-Temp', code: 'RCP-004', description: 'Низкотемпературная паста для чувствительных компонентов', version: '1.2', isActive: true },
    { name: 'Паяльная паста No-Clean', code: 'RCP-005', description: 'Безотмывочная паста для автоматизированного монтажа', version: '3.0', isActive: true },
    { name: 'Паяльная паста Water-Soluble', code: 'RCP-006', description: 'Водосмываемая паста для ручного монтажа', version: '1.8', isActive: true },
    { name: 'Паяльная паста Experimental-X', code: 'RCP-007', description: 'Экспериментальная формула (устарела)', version: '0.9', isActive: false },
  ];

  for (const recipeData of recipesData) {
    const recipe = await prisma.recipe.create({ data: recipeData });

    // Добавляем ингредиенты (5-8 на рецептуру)
    const ingredientCount = Math.floor(Math.random() * 4) + 5; // 5-8
    const rawMaterials = allMaterials.filter(m => m.category === 'RAW_MATERIAL');
    
    for (let i = 0; i < Math.min(ingredientCount, rawMaterials.length); i++) {
      const material = rawMaterials[i];
      const quantity = material.unit === 'kg' 
        ? Math.floor(Math.random() * 50) + 10 // 10-60 кг
        : Math.floor(Math.random() * 5) + 1;  // 1-6 л
      
      await prisma.recipeIngredient.create({
        data: {
          recipeId: recipe.id,
          materialId: material.id,
          quantity,
          unit: material.unit,
        },
      });
    }

    // Добавляем параметры (4-6 на рецептуру)
    const parameters = [
      { name: 'Температура смешивания', value: '25', unit: '°C', minValue: 20, maxValue: 30 },
      { name: 'Влажность', value: '45', unit: '%', minValue: 40, maxValue: 60 },
      { name: 'Время перемешивания', value: '15', unit: 'мин', minValue: 10, maxValue: 20 },
      { name: 'Скорость вращения', value: '500', unit: 'об/мин', minValue: 400, maxValue: 600 },
      { name: 'Давление', value: '1.2', unit: 'атм', minValue: 1.0, maxValue: 1.5 },
      { name: 'Вязкость', value: '180', unit: 'Па·с', minValue: 150, maxValue: 200 },
    ];

    const paramCount = Math.floor(Math.random() * 3) + 4; // 4-6
    for (let i = 0; i < paramCount; i++) {
      await prisma.recipeParameter.create({
        data: {
          recipeId: recipe.id,
          ...parameters[i],
        },
      });
    }
  }

  recipes = await prisma.recipe.findMany({ where: { isActive: true } });

  console.log('✅ Recipes created');

  // ============================================
  // 7. ПРОИЗВОДСТВЕННЫЕ ЗАКАЗЫ (12 заказов)
  // ============================================
  console.log('🏭 Creating production orders...');

  const statuses = ['PLANNED', 'PLANNED', 'IN_PROGRESS', 'IN_PROGRESS', 'IN_PROGRESS', 'IN_PROGRESS', 'COMPLETED', 'COMPLETED', 'COMPLETED', 'CANCELLED'];

  for (let i = 0; i < 12; i++) {
    const recipe = recipes[Math.floor(Math.random() * recipes.length)];
    const status = statuses[i] || 'PLANNED';
    
    const plannedDate = new Date();
    plannedDate.setDate(plannedDate.getDate() - Math.floor(Math.random() * 90)); // За последние 3 месяца
    
    const deadline = new Date(plannedDate);
    deadline.setDate(deadline.getDate() + Math.floor(Math.random() * 14) + 7); // +7-21 день
    
    // 20% просроченных заказов
    const isOverdue = Math.random() < 0.2 && status === 'IN_PROGRESS';
    if (isOverdue) {
      deadline.setDate(deadline.getDate() - Math.floor(Math.random() * 10) - 5); // Просрочка 5-15 дней
    }
    
    await prisma.productionOrder.create({
      data: {
        orderNumber: `ORD-2026-${String(i + 1).padStart(3, '0')}`,
        recipeId: recipe.id,
        plannedQty: Math.floor(Math.random() * 400) + 100, // 100-500 кг
        unit: 'kg',
        status,
        plannedDate,
        deadline,
        notes: isOverdue ? 'ВНИМАНИЕ: Заказ просрочен!' : null,
      },
    });
  }

  orders = await prisma.productionOrder.findMany();

  console.log('✅ Production orders created');

  // ============================================
  // 8. ПРОИЗВОДСТВЕННЫЕ ПАРТИИ (20 партий)
  // ============================================
  console.log('📦 Creating production batches...');

  const allUsers = await prisma.user.findMany();
  const batchStatuses = ['IN_PROGRESS', 'IN_PROGRESS', 'IN_PROGRESS', 'COMPLETED', 'COMPLETED', 'COMPLETED', 'COMPLETED', 'COMPLETED', 'COMPLETED', 'COMPLETED', 'COMPLETED', 'COMPLETED', 'DEFECTIVE', 'DEFECTIVE'];

  for (let i = 0; i < 20; i++) {
    const order = orders[Math.floor(Math.random() * orders.length)];
    const recipe = recipes.find(r => r.id === order.recipeId);
    const user = allUsers[Math.floor(Math.random() * allUsers.length)];
    const status = batchStatuses[i] || 'COMPLETED';
    
    const productionDate = new Date(order.plannedDate);
    productionDate.setDate(productionDate.getDate() + Math.floor(Math.random() * 7));
    
    const producedQty = Math.floor(Math.random() * 150) + 50; // 50-200 кг
    
    const batch = await prisma.productionBatch.create({
      data: {
        batchNumber: `BATCH-2026-${String(i + 1).padStart(3, '0')}`,
        orderId: order.id,
        recipeId: order.recipeId,
        producedQty,
        unit: 'kg',
        productionDate,
        producedBy: user.id,
        status,
        notes: status === 'DEFECTIVE' ? 'Обнаружен брак: несоответствие параметров' : null,
      },
    });

    // Добавляем параметры партии (4-6 параметров)
    const batchParams = [
      { name: 'Температура смешивания', value: String(Math.floor(Math.random() * 10) + 20), unit: '°C', minValue: 20, maxValue: 30 },
      { name: 'Влажность', value: String(Math.floor(Math.random() * 20) + 40), unit: '%', minValue: 40, maxValue: 60 },
      { name: 'Время перемешивания', value: String(Math.floor(Math.random() * 10) + 10), unit: 'мин', minValue: 10, maxValue: 20 },
      { name: 'Скорость вращения', value: String(Math.floor(Math.random() * 200) + 400), unit: 'об/мин', minValue: 400, maxValue: 600 },
      { name: 'Давление', value: (Math.random() * 0.5 + 1.0).toFixed(1), unit: 'атм', minValue: 1.0, maxValue: 1.5 },
      { name: 'Вязкость', value: String(Math.floor(Math.random() * 50) + 150), unit: 'Па·с', minValue: 150, maxValue: 200 },
    ];

    const paramCount = Math.floor(Math.random() * 3) + 4; // 4-6
    for (let j = 0; j < paramCount; j++) {
      const param = batchParams[j];
      const value = parseFloat(param.value);
      
      // 20% параметров вне нормы (для демонстрации)
      const isOutOfRange = Math.random() < 0.2;
      const finalValue = isOutOfRange 
        ? (Math.random() < 0.5 ? param.minValue - 5 : param.maxValue + 5)
        : value;
      
      await prisma.batchParameter.create({
        data: {
          batchId: batch.id,
          name: param.name,
          value: String(finalValue),
          unit: param.unit,
          isInRange: !isOutOfRange,
        },
      });
    }

    // Использование материалов (только для завершенных партий)
    if ((status === 'COMPLETED' || status === 'DEFECTIVE') && recipe) {
      const recipeIngredients = await prisma.recipeIngredient.findMany({
        where: { recipeId: recipe.id },
      });

      for (const ingredient of recipeIngredients) {
        const usedQty = Number(ingredient.quantity) * producedQty / 100; // Пропорционально
        
        await prisma.materialUsage.create({
          data: {
            batchId: batch.id,
            materialId: ingredient.materialId,
            quantity: usedQty,
            unit: ingredient.unit,
          },
        });

        // Создаем движение CONSUMPTION
        await prisma.stockMovement.create({
          data: {
            materialId: ingredient.materialId,
            movementType: 'CONSUMPTION',
            quantity: usedQty,
            unit: ingredient.unit,
            batchId: batch.id,
            notes: `Списание на партию ${batch.batchNumber}`,
          },
        });
      }
    }
  }

  console.log('✅ Production batches created');

  // ============================================
  // 9. ИНВЕНТАРИЗАЦИИ (5 инвентаризаций)
  // ============================================
  console.log('🔍 Creating inventory checks...');

  const inventoryStatuses = ['COMPLETED', 'COMPLETED', 'COMPLETED', 'IN_PROGRESS', 'COMPLETED'];

  for (let i = 0; i < 5; i++) {
    const status = inventoryStatuses[i];
    const checkDate = new Date();
    checkDate.setDate(checkDate.getDate() - Math.floor(Math.random() * 90)); // За последние 3 месяца
    
    const inventoryCheck = await prisma.inventoryCheck.create({
      data: {
        checkNumber: `INV-2026-${String(i + 1).padStart(3, '0')}`,
        checkDate,
        status,
        notes: status === 'IN_PROGRESS' ? 'Инвентаризация в процессе' : 'Плановая инвентаризация',
      },
    });

    // Добавляем позиции (10-15 материалов)
    const itemCount = Math.floor(Math.random() * 6) + 10; // 10-15
    const selectedMaterials = allMaterials.slice(0, itemCount);
    
    for (const material of selectedMaterials) {
      const systemQty = Math.floor(Math.random() * 100) + 50; // 50-150
      
      // 30% излишки, 30% недостача, 40% совпадение
      const rand = Math.random();
      let actualQty = systemQty;
      
      if (rand < 0.3) {
        // Излишки
        actualQty = systemQty + Math.floor(Math.random() * 10) + 1;
      } else if (rand < 0.6) {
        // Недостача
        actualQty = systemQty - Math.floor(Math.random() * 10) - 1;
      }
      
      const difference = actualQty - systemQty;
      
      await prisma.inventoryCheckItem.create({
        data: {
          checkId: inventoryCheck.id,
          materialId: material.id,
          systemQty,
          actualQty,
          difference,
          unit: material.unit,
          notes: difference > 0 ? 'Излишки' : difference < 0 ? 'Недостача' : null,
        },
      });

      // Если инвентаризация завершена и есть расхождения, создаем корректировку
      if (status === 'COMPLETED' && difference !== 0) {
        await prisma.stockMovement.create({
          data: {
            materialId: material.id,
            movementType: 'ADJUSTMENT',
            quantity: Math.abs(difference),
            unit: material.unit,
            documentNumber: inventoryCheck.checkNumber,
            notes: `Корректировка по инвентаризации: ${difference > 0 ? 'излишек' : 'недостача'}`,
          },
        });
      }
    }
  }

  console.log('✅ Inventory checks created');

  // ============================================
  // 10. СЕРВИСНЫЕ ЗАКАЗЫ (15 заказов)
  // ============================================
  console.log('🔧 Creating service orders...');

  const customers = await prisma.contractor.findMany({ where: { type: 'CUSTOMER' } });
  const engineers = await prisma.user.findMany({
    where: {
      roles: {
        some: {
          role: {
            name: 'ENGINEER',
          },
        },
      },
    },
  });

  const serviceStatuses = ['PLANNED', 'PLANNED', 'IN_PROGRESS', 'IN_PROGRESS', 'IN_PROGRESS', 'IN_PROGRESS', 'IN_PROGRESS', 'ON_HOLD', 'ON_HOLD', 'COMPLETED', 'COMPLETED', 'COMPLETED', 'COMPLETED', 'CANCELLED'];
  const priorities = ['LOW', 'LOW', 'LOW', 'MEDIUM', 'MEDIUM', 'MEDIUM', 'MEDIUM', 'MEDIUM', 'HIGH', 'HIGH', 'HIGH', 'HIGH', 'URGENT', 'URGENT'];
  
  const equipmentTypes = [
    'Линия SMT',
    'Печь оплавления',
    'Автомат установки компонентов',
    'Принтер трафаретной печати',
    'Инспекционная система AOI',
    'Система селективной пайки',
    'Автомат волновой пайки',
    'Станок фрезерный ЧПУ',
  ];

  for (let i = 0; i < 15; i++) {
    const customer = customers[Math.floor(Math.random() * customers.length)];
    const status = serviceStatuses[i] || 'PLANNED';
    const priority = priorities[i] || 'MEDIUM';
    const equipmentType = equipmentTypes[Math.floor(Math.random() * equipmentTypes.length)];
    
    const plannedStart = new Date();
    plannedStart.setDate(plannedStart.getDate() - Math.floor(Math.random() * 180) + 30); // От -150 до +30 дней
    
    const plannedEnd = new Date(plannedStart);
    plannedEnd.setDate(plannedEnd.getDate() + Math.floor(Math.random() * 7) + 3); // +3-10 дней
    
    const actualStart = ['IN_PROGRESS', 'COMPLETED', 'ON_HOLD'].includes(status) 
      ? new Date(plannedStart)
      : null;
    
    const actualEnd = status === 'COMPLETED'
      ? new Date(plannedEnd)
      : null;
    
    const serviceOrder = await prisma.serviceOrder.create({
      data: {
        orderNumber: `SO-2026-${String(i + 1).padStart(3, '0')}`,
        customerId: customer.id,
        equipmentType,
        equipmentModel: `Model-${Math.floor(Math.random() * 100) + 1}`,
        location: customer.address || 'Адрес не указан',
        description: `Пусконаладка оборудования ${equipmentType}. ${priority === 'URGENT' ? 'СРОЧНО!' : ''}`,
        plannedStart,
        plannedEnd,
        actualStart,
        actualEnd,
        status,
        priority,
        notes: status === 'ON_HOLD' ? 'Приостановлено: ожидание запчастей' : null,
      },
    });

    // Назначаем инженеров (1-3 на заказ)
    const engineerCount = Math.floor(Math.random() * 3) + 1; // 1-3
    const selectedEngineers = engineers.sort(() => 0.5 - Math.random()).slice(0, engineerCount);
    
    for (const engineer of selectedEngineers) {
      await prisma.serviceAssignment.create({
        data: {
          orderId: serviceOrder.id,
          engineerId: engineer.id,
          notes: selectedEngineers[0].id === engineer.id ? 'Ответственный инженер' : 'Помощник',
        },
      });
    }

    // Журнал работ (3-10 записей для активных и завершенных заказов)
    if (['IN_PROGRESS', 'COMPLETED', 'ON_HOLD'].includes(status) && actualStart) {
      const logCount = Math.floor(Math.random() * 8) + 3; // 3-10
      
      for (let j = 0; j < logCount; j++) {
        const engineer = selectedEngineers[Math.floor(Math.random() * selectedEngineers.length)];
        const workDate = new Date(actualStart);
        workDate.setDate(workDate.getDate() + j);
        
        const startTime = new Date(workDate);
        startTime.setHours(9, 0, 0, 0);
        
        const endTime = new Date(startTime);
        endTime.setHours(startTime.getHours() + Math.floor(Math.random() * 6) + 3); // 3-9 часов
        
        const workDescriptions = [
          'Диагностика оборудования',
          'Калибровка температурного профиля',
          'Замена изношенных компонентов',
          'Настройка программного обеспечения',
          'Тестовый запуск производственной линии',
          'Обучение персонала заказчика',
          'Проверка систем безопасности',
          'Оптимизация параметров работы',
          'Устранение выявленных неисправностей',
          'Финальная приемка оборудования',
        ];
        
        const workStatus = j === logCount - 1 && status === 'COMPLETED' ? 'COMPLETED' : 'COMPLETED';
        
        await prisma.workLog.create({
          data: {
            orderId: serviceOrder.id,
            engineerId: engineer.id,
            workDate,
            startTime,
            endTime,
            description: workDescriptions[Math.floor(Math.random() * workDescriptions.length)],
            result: workStatus === 'COMPLETED' ? 'Работы выполнены в полном объеме' : 'Работы продолжаются',
            status: workStatus,
          },
        });
      }
    }

    // Документы (2-5 на заказ для завершенных)
    if (status === 'COMPLETED') {
      const docTypes = ['ACT', 'REPORT', 'PHOTO', 'MANUAL'];
      const docCount = Math.floor(Math.random() * 4) + 2; // 2-5
      
      for (let j = 0; j < docCount; j++) {
        const docType = docTypes[Math.floor(Math.random() * docTypes.length)];
        const fileName = `${docType}_${serviceOrder.orderNumber}_${j + 1}.pdf`;
        
        await prisma.serviceDocument.create({
          data: {
            orderId: serviceOrder.id,
            docType,
            fileName,
            filePath: `/uploads/service-orders/${serviceOrder.orderNumber}/${fileName}`,
            fileSize: Math.floor(Math.random() * 5000000) + 100000, // 100KB - 5MB
          },
        });
      }
    }

    // Использованные материалы в ПНР (для некоторых заказов)
    if (Math.random() < 0.4 && ['IN_PROGRESS', 'COMPLETED'].includes(status)) {
      const spareParts = allMaterials.filter(m => m.category === 'SPARE_PART');
      const usedPartsCount = Math.floor(Math.random() * 3) + 1; // 1-3
      
      for (let j = 0; j < usedPartsCount; j++) {
        const sparePart = spareParts[Math.floor(Math.random() * spareParts.length)];
        const quantity = Math.floor(Math.random() * 3) + 1; // 1-3 шт
        
        await prisma.stockMovement.create({
          data: {
            materialId: sparePart.id,
            movementType: 'CONSUMPTION',
            quantity,
            unit: sparePart.unit,
            serviceOrderId: serviceOrder.id,
            documentNumber: serviceOrder.orderNumber,
            notes: `Использовано в ПНР: ${serviceOrder.orderNumber}`,
          },
        });
      }
    }
  }

  console.log('✅ Service orders created');

  // ============================================
  // ФИНАЛ
  // ============================================
  console.log('');
  console.log('🎉 Seeding completed successfully!');
  console.log('');
  console.log('📊 Summary:');
  console.log(`   👥 Users: ${allUsers.length}`);
  console.log(`   📦 Materials: ${allMaterials.length}`);
  console.log(`   📋 Recipes: ${recipes.length}`);
  console.log(`   🏭 Production Orders: ${orders.length}`);
  console.log(`   📦 Production Batches: 20`);
  console.log(`   🔍 Inventory Checks: 5`);
  console.log(`   🏢 Contractors: ${contractors.length}`);
  console.log(`   🔧 Service Orders: 15`);
  console.log('');
  console.log('📋 Test accounts (password: 123456):');
  console.log('   admin@smtmax.ru');
  console.log('   manager@smtmax.ru');
  console.log('   warehouse@smtmax.ru');
  console.log('   technologist@smtmax.ru');
  console.log('   service@smtmax.ru');
  console.log('   engineer1@smtmax.ru');
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
