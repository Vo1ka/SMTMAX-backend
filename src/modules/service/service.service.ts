import { Injectable, NotFoundException, ConflictException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { CreateServiceOrderDto } from './dto/create-service-order.dto';
import { UpdateServiceOrderDto } from './dto/update-service-order.dto';
import { UpdateServiceOrderStatusDto } from './dto/update-service-order-status.dto';
import { QueryServiceOrdersDto } from './dto/query-service-orders.dto';
import { AssignEngineerDto } from './dto/assign-engineer.dto';
import { CreateWorkLogDto } from './dto/create-work-log.dto';
import { UpdateWorkLogDto } from './dto/update-work-log.dto';
import { QueryWorkLogsDto } from './dto/query-work-logs.dto';import { PrismaService} from '../../prisma/prisma.service';


@Injectable()
export class ServiceService {
  constructor(private prisma: PrismaService) {}

  // ============================================
  // СЕРВИСНЫЕ ЗАКАЗЫ
  // ============================================

  async createOrder(dto: CreateServiceOrderDto) {
    // Проверка на существование заказа с таким номером
    const existingOrder = await this.prisma.serviceOrder.findUnique({
      where: { orderNumber: dto.orderNumber },
    });

    if (existingOrder) {
      throw new ConflictException('Service order with this number already exists');
    }

    // Проверка существования заказчика
    const customer = await this.prisma.contractor.findUnique({
      where: { id: dto.customerId },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    if (customer.type !== 'CUSTOMER' && customer.type !== 'BOTH') {
      throw new BadRequestException('Contractor is not a customer');
    }

    // Создание заказа
    const order = await this.prisma.serviceOrder.create({
      data: {
        orderNumber: dto.orderNumber,
        customerId: dto.customerId,
        equipmentType: dto.equipmentType,
        equipmentModel: dto.equipmentModel,
        location: dto.location,
        description: dto.description,
        plannedStart: dto.plannedStart ? new Date(dto.plannedStart) : null,
        plannedEnd: dto.plannedEnd ? new Date(dto.plannedEnd) : null,
        status: 'PLANNED',
        priority: dto.priority || 'MEDIUM',
        notes: dto.notes,
      },
      include: {
        customer: true,
      },
    });

    return order;
  }

  async findAllOrders(query: QueryServiceOrdersDto, userRoles: string[], userId: number) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const search = query.search;
    const status = query.status;
    const priority = query.priority;
    const customerId = query.customerId;
    const sortBy = query.sortBy ?? 'createdAt';
    const sortOrder = query.sortOrder ?? 'desc';

    const skip = (page - 1) * limit;

    // Построение фильтров
    const where: any = {};

    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { equipmentType: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = priority;
    }

    if (customerId) {
      where.customerId = customerId;
    }

    // Инженер видит только свои заказы
    if (userRoles.includes('ENGINEER') && !userRoles.includes('SERVICE_MANAGER') && !userRoles.includes('ADMIN')) {
      where.assignments = {
        some: {
          engineerId: userId,
        },
      };
    }

    // Безопасная сортировка
    const validSortFields = ['id', 'orderNumber', 'plannedStart', 'plannedEnd', 'status', 'priority', 'createdAt'];
    const safeSortBy = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    
    const orderBy: Record<string, 'asc' | 'desc'> = {
      [safeSortBy]: sortOrder,
    };

    // Получение данных
    const [orders, total] = await Promise.all([
      this.prisma.serviceOrder.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          customer: true,
          _count: {
            select: {
              assignments: true,
              workLogs: true,
              documents: true,
            },
          },
        },
      }),
      this.prisma.serviceOrder.count({ where }),
    ]);

    return {
      data: orders,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOrderById(id: number, userRoles: string[], userId: number) {
    const order = await this.prisma.serviceOrder.findUnique({
      where: { id },
      include: {
        customer: true,
        assignments: {
          include: {
            engineer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        workLogs: {
          include: {
            engineer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: {
            workDate: 'desc',
          },
        },
        documents: {
          orderBy: {
            uploadedAt: 'desc',
          },
        },
        stockMovements: {
          include: {
            material: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Service order not found');
    }

    // Проверка доступа для инженера
    if (userRoles.includes('ENGINEER') && !userRoles.includes('SERVICE_MANAGER') && !userRoles.includes('ADMIN')) {
      const isAssigned = order.assignments.some(a => a.engineerId === userId);
      if (!isAssigned) {
        throw new ForbiddenException('Access denied to this service order');
      }
    }

    return order;
  }

  async updateOrder(id: number, dto: UpdateServiceOrderDto) {
    const order = await this.prisma.serviceOrder.findUnique({ where: { id } });

    if (!order) {
      throw new NotFoundException('Service order not found');
    }

    // Проверка заказчика, если меняется
    if (dto.customerId) {
      const customer = await this.prisma.contractor.findUnique({
        where: { id: dto.customerId },
      });

      if (!customer) {
        throw new NotFoundException('Customer not found');
      }

      if (customer.type !== 'CUSTOMER' && customer.type !== 'BOTH') {
        throw new BadRequestException('Contractor is not a customer');
      }
    }

    const updatedOrder = await this.prisma.serviceOrder.update({
      where: { id },
      data: {
        customerId: dto.customerId,
        equipmentType: dto.equipmentType,
        equipmentModel: dto.equipmentModel,
        location: dto.location,
        description: dto.description,
        plannedStart: dto.plannedStart ? new Date(dto.plannedStart) : undefined,
        plannedEnd: dto.plannedEnd ? new Date(dto.plannedEnd) : undefined,
        actualStart: dto.actualStart ? new Date(dto.actualStart) : undefined,
        actualEnd: dto.actualEnd ? new Date(dto.actualEnd) : undefined,
        priority: dto.priority,
        notes: dto.notes,
      },
      include: {
        customer: true,
      },
    });

    return updatedOrder;
  }

  async updateOrderStatus(id: number, dto: UpdateServiceOrderStatusDto) {
    const order = await this.prisma.serviceOrder.findUnique({ where: { id } });

    if (!order) {
      throw new NotFoundException('Service order not found');
    }

    const updatedOrder = await this.prisma.serviceOrder.update({
      where: { id },
      data: { status: dto.status },
      include: {
        customer: true,
      },
    });

    return updatedOrder;
  }

  async deleteOrder(id: number) {
    const order = await this.prisma.serviceOrder.findUnique({ where: { id } });

    if (!order) {
      throw new NotFoundException('Service order not found');
    }

    // Удаление заказа (каскадно удалятся assignments, workLogs, documents)
    await this.prisma.serviceOrder.delete({ where: { id } });

    return { message: 'Service order deleted successfully' };
  }

  // ============================================
  // НАЗНАЧЕНИЕ ИНЖЕНЕРОВ
  // ============================================

  async assignEngineer(orderId: number, dto: AssignEngineerDto) {
    // Проверка существования заказа
    const order = await this.prisma.serviceOrder.findUnique({ where: { id: orderId } });

    if (!order) {
      throw new NotFoundException('Service order not found');
    }

    // Проверка существования инженера
    const engineer = await this.prisma.user.findUnique({
      where: { id: dto.engineerId },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!engineer) {
      throw new NotFoundException('Engineer not found');
    }

    // Проверка, что пользователь имеет роль ENGINEER
    const hasEngineerRole = engineer.roles.some(ur => ur.role.name === 'ENGINEER' || ur.role.name === 'SERVICE_MANAGER');

    if (!hasEngineerRole) {
      throw new BadRequestException('User is not an engineer');
    }

    // Проверка, что инженер еще не назначен
    const existingAssignment = await this.prisma.serviceAssignment.findFirst({
      where: {
        orderId,
        engineerId: dto.engineerId,
      },
    });

    if (existingAssignment) {
      throw new BadRequestException('Engineer already assigned to this order');
    }

    // Назначение инженера
    const assignment = await this.prisma.serviceAssignment.create({
      data: {
        orderId,
        engineerId: dto.engineerId,
        notes: dto.notes,
      },
      include: {
        engineer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    // Обновление статуса заказа на ASSIGNED, если был PLANNED
    if (order.status === 'PLANNED') {
      await this.prisma.serviceOrder.update({
        where: { id: orderId },
        data: { status: 'ASSIGNED' },
      });
    }

    return assignment;
  }

  async removeEngineer(orderId: number, assignmentId: number) {
    const assignment = await this.prisma.serviceAssignment.findUnique({
      where: { id: assignmentId },
    });

    if (!assignment || assignment.orderId !== orderId) {
      throw new NotFoundException('Assignment not found');
    }

    await this.prisma.serviceAssignment.delete({
      where: { id: assignmentId },
    });

    return { message: 'Engineer removed from order successfully' };
  }

  // ============================================
  // ЖУРНАЛ РАБОТ
  // ============================================

  async createWorkLog(orderId: number, dto: CreateWorkLogDto, engineerId: number) {
    // Проверка существования заказа
    const order = await this.prisma.serviceOrder.findUnique({
      where: { id: orderId },
      include: {
        assignments: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Service order not found');
    }

    // Проверка, что инженер назначен на заказ
    const isAssigned = order.assignments.some(a => a.engineerId === engineerId);

    if (!isAssigned) {
      throw new ForbiddenException('Engineer is not assigned to this order');
    }

    // Создание записи в журнале
    const workLog = await this.prisma.workLog.create({
      data: {
        orderId,
        engineerId,
        workDate: new Date(dto.workDate),
        startTime: new Date(dto.startTime),
        endTime: dto.endTime ? new Date(dto.endTime) : null,
        description: dto.description,
        result: dto.result,
        status: dto.status || 'IN_PROGRESS',
      },
      include: {
        engineer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Обновление статуса заказа на IN_PROGRESS, если был ASSIGNED
    if (order.status === 'ASSIGNED' || order.status === 'PLANNED') {
      await this.prisma.serviceOrder.update({
        where: { id: orderId },
        data: { 
          status: 'IN_PROGRESS',
          actualStart: order.actualStart || new Date(),
        },
      });
    }

    return workLog;
  }

  async findWorkLogsByOrder(orderId: number, query: QueryWorkLogsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const status = query.status;
    const sortBy = query.sortBy ?? 'workDate';
    const sortOrder = query.sortOrder ?? 'desc';

    const skip = (page - 1) * limit;

    // Построение фильтров
    const where: any = { orderId };

    if (status) {
      where.status = status;
    }

    // Безопасная сортировка
    const validSortFields = ['id', 'workDate', 'startTime', 'endTime', 'status', 'createdAt'];
    const safeSortBy = validSortFields.includes(sortBy) ? sortBy : 'workDate';
    
    const orderBy: Record<string, 'asc' | 'desc'> = {
      [safeSortBy]: sortOrder,
    };

    // Получение данных
    const [workLogs, total] = await Promise.all([
      this.prisma.workLog.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          engineer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      this.prisma.workLog.count({ where }),
    ]);

    return {
      data: workLogs,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateWorkLog(orderId: number, workLogId: number, dto: UpdateWorkLogDto, userId: number, userRoles: string[]) {
    const workLog = await this.prisma.workLog.findUnique({
      where: { id: workLogId },
    });

    if (!workLog || workLog.orderId !== orderId) {
      throw new NotFoundException('Work log not found');
    }

    // Проверка прав: только автор или менеджер/админ может редактировать
    if (workLog.engineerId !== userId && !userRoles.includes('SERVICE_MANAGER') && !userRoles.includes('ADMIN')) {
      throw new ForbiddenException('You can only edit your own work logs');
    }

    const updatedWorkLog = await this.prisma.workLog.update({
      where: { id: workLogId },
      data: {
        workDate: dto.workDate ? new Date(dto.workDate) : undefined,
        startTime: dto.startTime ? new Date(dto.startTime) : undefined,
        endTime: dto.endTime ? new Date(dto.endTime) : undefined,
        description: dto.description,
        result: dto.result,
        status: dto.status,
      },
      include: {
        engineer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return updatedWorkLog;
  }

  async deleteWorkLog(orderId: number, workLogId: number, userId: number, userRoles: string[]) {
    const workLog = await this.prisma.workLog.findUnique({
      where: { id: workLogId },
    });

    if (!workLog || workLog.orderId !== orderId) {
      throw new NotFoundException('Work log not found');
    }

    // Проверка прав: только автор или менеджер/админ может удалять
    if (workLog.engineerId !== userId && !userRoles.includes('SERVICE_MANAGER') && !userRoles.includes('ADMIN')) {
      throw new ForbiddenException('You can only delete your own work logs');
    }

    await this.prisma.workLog.delete({
      where: { id: workLogId },
    });

    return { message: 'Work log deleted successfully' };
  }

  // ============================================
  // ДОКУМЕНТЫ (заглушка для будущей реализации с файлами)
  // ============================================

  async getDocuments(orderId: number) {
    const order = await this.prisma.serviceOrder.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Service order not found');
    }

    const documents = await this.prisma.serviceDocument.findMany({
      where: { orderId },
      orderBy: { uploadedAt: 'desc' },
    });

    return documents;
  }

  // Метод для загрузки файлов будет реализован позже с Multer/S3
}
