import { Injectable } from '@nestjs/common';
import { ProductionReportQueryDto } from './dto/production-report-query.dto';
import { StockReportQueryDto } from './dto/stock-report-query.dto';
import { ServiceReportQueryDto } from './dto/service-report-query.dto';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  // ============================================
  // ОТЧЕТЫ ПО ПРОИЗВОДСТВУ
  // ============================================

  async getProductionSummary(query: ProductionReportQueryDto) {
    const dateFrom = new Date(query.dateFrom);
    const dateTo = new Date(query.dateTo);

    const where: any = {
      productionDate: {
        gte: dateFrom,
        lte: dateTo,
      },
    };

    if (query.recipeId) {
      where.recipeId = query.recipeId;
    }

    // Получение всех партий за период
    const batches = await this.prisma.productionBatch.findMany({
      where,
      include: {
        recipe: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        order: {
          select: {
            id: true,
            orderNumber: true,
            plannedQty: true,
          },
        },
      },
    });

    // Получение заказов за период
    const orders = await this.prisma.productionOrder.findMany({
      where: {
        plannedDate: {
          gte: dateFrom,
          lte: dateTo,
        },
        ...(query.recipeId ? { recipeId: query.recipeId } : {}),
      },
    });

    // Подсчет статистики
    const totalBatches = batches.length;
    const totalProducedQty = batches.reduce((sum, batch) => sum + Number(batch.producedQty), 0);
    const completedBatches = batches.filter(b => b.status === 'COMPLETED').length;
    const defectiveBatches = batches.filter(b => b.status === 'DEFECTIVE').length;

    const totalOrders = orders.length;
    const completedOrders = orders.filter(o => o.status === 'COMPLETED').length;
    const inProgressOrders = orders.filter(o => o.status === 'IN_PROGRESS').length;
    const plannedOrders = orders.filter(o => o.status === 'PLANNED').length;
    const cancelledOrders = orders.filter(o => o.status === 'CANCELLED').length;

    const totalPlannedQty = orders.reduce((sum, order) => sum + Number(order.plannedQty), 0);

    // Группировка по рецептурам
    const byRecipe = batches.reduce((acc, batch) => {
      const recipeId = batch.recipeId;
      if (!acc[recipeId]) {
        acc[recipeId] = {
          recipeId: batch.recipe.id,
          recipeName: batch.recipe.name,
          recipeCode: batch.recipe.code,
          batchesCount: 0,
          producedQty: 0,
          unit: batch.unit,
        };
      }
      acc[recipeId].batchesCount++;
      acc[recipeId].producedQty += Number(batch.producedQty);
      return acc;
    }, {} as Record<number, any>);

    return {
      period: {
        from: dateFrom,
        to: dateTo,
      },
      summary: {
        totalOrders,
        completedOrders,
        inProgressOrders,
        plannedOrders,
        cancelledOrders,
        totalPlannedQty,
        totalBatches,
        completedBatches,
        defectiveBatches,
        totalProducedQty,
        completionRate: totalOrders > 0 ? ((completedOrders / totalOrders) * 100).toFixed(2) : 0,
        defectRate: totalBatches > 0 ? ((defectiveBatches / totalBatches) * 100).toFixed(2) : 0,
      },
      byRecipe: Object.values(byRecipe),
    };
  }

  async getProductionEfficiency(query: ProductionReportQueryDto) {
    const dateFrom = new Date(query.dateFrom);
    const dateTo = new Date(query.dateTo);

    const where: any = {
      productionDate: {
        gte: dateFrom,
        lte: dateTo,
      },
      status: 'COMPLETED',
    };

    if (query.recipeId) {
      where.recipeId = query.recipeId;
    }

    // Получение партий с использованием материалов
    const batches = await this.prisma.productionBatch.findMany({
      where,
      include: {
        recipe: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        materialUsage: {
          include: {
            material: true,
          },
        },
      },
    });

    // Анализ эффективности использования материалов
    const efficiency = batches.map(batch => {
      const totalMaterialCost = batch.materialUsage.reduce((sum, usage) => {
        // Здесь можно добавить расчет стоимости, если она есть в материалах
        return sum + Number(usage.quantity);
      }, 0);

      return {
        batchNumber: batch.batchNumber,
        recipeName: batch.recipe.name,
        producedQty: batch.producedQty,
        unit: batch.unit,
        productionDate: batch.productionDate,
        materialsUsed: batch.materialUsage.map(usage => ({
          materialName: usage.material.name,
          materialCode: usage.material.code,
          quantity: usage.quantity,
          unit: usage.unit,
        })),
        totalMaterialQuantity: totalMaterialCost,
      };
    });

    return {
      period: {
        from: dateFrom,
        to: dateTo,
      },
      batches: efficiency,
      summary: {
        totalBatches: batches.length,
        totalProducedQty: batches.reduce((sum, b) => sum + Number(b.producedQty), 0),
      },
    };
  }

  async getProductionBatches(query: ProductionReportQueryDto) {
    const dateFrom = new Date(query.dateFrom);
    const dateTo = new Date(query.dateTo);

    const where: any = {
      productionDate: {
        gte: dateFrom,
        lte: dateTo,
      },
    };

    if (query.recipeId) {
      where.recipeId = query.recipeId;
    }

    const batches = await this.prisma.productionBatch.findMany({
      where,
      include: {
        recipe: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        order: {
          select: {
            id: true,
            orderNumber: true,
          },
        },
        producer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        parameters: true,
      },
      orderBy: {
        productionDate: 'desc',
      },
    });

    return {
      period: {
        from: dateFrom,
        to: dateTo,
      },
      batches,
    };
  }

  // ============================================
  // ОТЧЕТЫ ПО СКЛАДУ
  // ============================================

  async getStockMovements(query: StockReportQueryDto) {
    const dateFrom = new Date(query.dateFrom);
    const dateTo = new Date(query.dateTo);

    const where: any = {
      createdAt: {
        gte: dateFrom,
        lte: dateTo,
      },
    };

    if (query.materialId) {
      where.materialId = query.materialId;
    }

    if (query.movementType) {
      where.movementType = query.movementType;
    }

    const movements = await this.prisma.stockMovement.findMany({
      where,
      include: {
        material: true,
        stockItem: true,
        batch: {
          select: {
            id: true,
            batchNumber: true,
          },
        },
        serviceOrder: {
          select: {
            id: true,
            orderNumber: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Группировка по типам движения
    const byType = movements.reduce((acc, movement) => {
      const type = movement.movementType;
      if (!acc[type]) {
        acc[type] = {
          type,
          count: 0,
          totalQuantity: 0,
        };
      }
      acc[type].count++;
      acc[type].totalQuantity += Number(movement.quantity);
      return acc;
    }, {} as Record<string, any>);

    // Группировка по материалам
    const byMaterial = movements.reduce((acc, movement) => {
      const materialId = movement.materialId;
      if (!acc[materialId]) {
        acc[materialId] = {
          materialId: movement.material.id,
          materialName: movement.material.name,
          materialCode: movement.material.code,
          unit: movement.material.unit,
          receipt: 0,
          consumption: 0,
          adjustment: 0,
          transfer: 0,
        };
      }
      const qty = Number(movement.quantity);
      switch (movement.movementType) {
        case 'RECEIPT':
          acc[materialId].receipt += qty;
          break;
        case 'CONSUMPTION':
          acc[materialId].consumption += qty;
          break;
        case 'ADJUSTMENT':
          acc[materialId].adjustment += qty;
          break;
        case 'TRANSFER':
          acc[materialId].transfer += qty;
          break;
      }
      return acc;
    }, {} as Record<number, any>);

    return {
      period: {
        from: dateFrom,
        to: dateTo,
      },
      summary: {
        totalMovements: movements.length,
        byType: Object.values(byType),
      },
      byMaterial: Object.values(byMaterial),
      movements,
    };
  }

  async getStockBalance() {
    // Получаем все активные материалы с остатками
    const materials = await this.prisma.material.findMany({
      where: { isActive: true },
      include: {
        stockItems: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    const balance = materials.map(material => {
      const totalQuantity = material.stockItems.reduce(
        (sum, item) => sum + Number(item.quantity),
        0,
      );

      const isLowStock = material.minStock
        ? totalQuantity < Number(material.minStock)
        : false;

      return {
        materialId: material.id,
        materialName: material.name,
        materialCode: material.code,
        category: material.category,
        unit: material.unit,
        totalQuantity,
        minStock: material.minStock,
        isLowStock,
        stockItems: material.stockItems.map(item => ({
          id: item.id,
          lotNumber: item.lotNumber,
          quantity: item.quantity,
          expiryDate: item.expiryDate,
          receivedDate: item.receivedDate,
        })),
      };
    });

    return {
      materials: balance,
      summary: {
        totalMaterials: materials.length,
        lowStockMaterials: balance.filter(m => m.isLowStock).length,
      },
    };
  }

  // ============================================
  // ОТЧЕТЫ ПО СЕРВИСНЫМ РАБОТАМ
  // ============================================

  async getServiceOrders(query: ServiceReportQueryDto) {
    const dateFrom = new Date(query.dateFrom);
    const dateTo = new Date(query.dateTo);

    const where: any = {
      createdAt: {
        gte: dateFrom,
        lte: dateTo,
      },
    };

    if (query.customerId) {
      where.customerId = query.customerId;
    }

    if (query.status) {
      where.status = query.status;
    }

    const orders = await this.prisma.serviceOrder.findMany({
      where,
      include: {
        customer: true,
        assignments: {
          include: {
            engineer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        workLogs: true,
        documents: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Статистика по статусам
    const byStatus = orders.reduce((acc, order) => {
      const status = order.status;
      if (!acc[status]) {
        acc[status] = {
          status,
          count: 0,
        };
      }
      acc[status].count++;
      return acc;
    }, {} as Record<string, any>);

    // Статистика по приоритетам
    const byPriority = orders.reduce((acc, order) => {
      const priority = order.priority || 'MEDIUM';
      if (!acc[priority]) {
        acc[priority] = {
          priority,
          count: 0,
        };
      }
      acc[priority].count++;
      return acc;
    }, {} as Record<string, any>);

    return {
      period: {
        from: dateFrom,
        to: dateTo,
      },
      summary: {
        totalOrders: orders.length,
        byStatus: Object.values(byStatus),
        byPriority: Object.values(byPriority),
      },
      orders,
    };
  }

  async getServiceWorkload(query: ServiceReportQueryDto) {
    const dateFrom = new Date(query.dateFrom);
    const dateTo = new Date(query.dateTo);

    // Получаем всех инженеров
    const engineers = await this.prisma.user.findMany({
      where: {
        roles: {
          some: {
            role: {
              name: {
                in: ['ENGINEER', 'SERVICE_MANAGER'],
              },
            },
          },
        },
        isActive: true,
      },
      include: {
        serviceAssignments: {
          where: {
            order: {
              createdAt: {
                gte: dateFrom,
                lte: dateTo,
              },
            },
          },
          include: {
            order: true,
          },
        },
        workLogs: {
          where: {
            workDate: {
              gte: dateFrom,
              lte: dateTo,
            },
          },
        },
      },
    });

    const workload = engineers.map(engineer => {
      const assignedOrders = engineer.serviceAssignments.length;
      const completedWorkLogs = engineer.workLogs.filter(wl => wl.status === 'COMPLETED').length;
      const totalWorkLogs = engineer.workLogs.length;

      // Подсчет общего времени работы
      const totalHours = engineer.workLogs.reduce((sum, log) => {
        if (log.endTime) {
          const hours = (new Date(log.endTime).getTime() - new Date(log.startTime).getTime()) / (1000 * 60 * 60);
          return sum + hours;
        }
        return sum;
      }, 0);

      return {
        engineerId: engineer.id,
        engineerName: `${engineer.firstName} ${engineer.lastName}`,
        email: engineer.email,
        assignedOrders,
        totalWorkLogs,
        completedWorkLogs,
        totalHours: totalHours.toFixed(2),
        orders: engineer.serviceAssignments.map(a => ({
          orderId: a.order.id,
          orderNumber: a.order.orderNumber,
          status: a.order.status,
          location: a.order.location,
        })),
      };
    });

    return {
      period: {
        from: dateFrom,
        to: dateTo,
      },
      engineers: workload,
      summary: {
        totalEngineers: engineers.length,
        totalAssignments: workload.reduce((sum, e) => sum + e.assignedOrders, 0),
        totalWorkLogs: workload.reduce((sum, e) => sum + e.totalWorkLogs, 0),
        totalHours: workload.reduce((sum, e) => sum + parseFloat(e.totalHours), 0).toFixed(2),
      },
    };
  }

  async getServiceMaterials(query: ServiceReportQueryDto) {
    const dateFrom = new Date(query.dateFrom);
    const dateTo = new Date(query.dateTo);

    const where: any = {
      createdAt: {
        gte: dateFrom,
        lte: dateTo,
      },
      serviceOrderId: {
        not: null,
      },
    };

    const movements = await this.prisma.stockMovement.findMany({
      where,
      include: {
        material: true,
        serviceOrder: {
          select: {
            id: true,
            orderNumber: true,
            customer: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Группировка по материалам
    const byMaterial = movements.reduce((acc, movement) => {
      const materialId = movement.materialId;
      if (!acc[materialId]) {
        acc[materialId] = {
          materialId: movement.material.id,
          materialName: movement.material.name,
          materialCode: movement.material.code,
          unit: movement.material.unit,
          totalQuantity: 0,
          usageCount: 0,
        };
      }
      acc[materialId].totalQuantity += Number(movement.quantity);
      acc[materialId].usageCount++;
      return acc;
    }, {} as Record<number, any>);

    return {
      period: {
        from: dateFrom,
        to: dateTo,
      },
      summary: {
        totalMovements: movements.length,
        uniqueMaterials: Object.keys(byMaterial).length,
      },
      byMaterial: Object.values(byMaterial),
      movements,
    };
  }

  // ============================================
  // ДАШБОРД ДЛЯ РУКОВОДСТВА
  // ============================================

  async getDashboard() {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Производство за текущий месяц
    const productionBatches = await this.prisma.productionBatch.count({
      where: {
        productionDate: {
          gte: monthStart,
          lte: monthEnd,
        },
        status: 'COMPLETED',
      },
    });

    const totalProduced = await this.prisma.productionBatch.aggregate({
      where: {
        productionDate: {
          gte: monthStart,
          lte: monthEnd,
        },
        status: 'COMPLETED',
      },
      _sum: {
        producedQty: true,
      },
    });

    // Сервисные работы за текущий месяц
    const serviceOrders = await this.prisma.serviceOrder.count({
      where: {
        createdAt: {
          gte: monthStart,
          lte: monthEnd,
        },
      },
    });

    const completedServiceOrders = await this.prisma.serviceOrder.count({
      where: {
        createdAt: {
          gte: monthStart,
          lte: monthEnd,
        },
        status: 'COMPLETED',
      },
    });

    // Низкие остатки на складе
    const materials = await this.prisma.material.findMany({
      where: {
        isActive: true,
        minStock: { not: null },
      },
      include: {
        stockItems: true,
      },
    });

    const lowStockCount = materials.filter(material => {
      const totalQuantity = material.stockItems.reduce(
        (sum, item) => sum + Number(item.quantity),
        0,
      );
      return material.minStock && totalQuantity < Number(material.minStock);
    }).length;

    // Активные пользователи
    const activeUsers = await this.prisma.user.count({
      where: { isActive: true },
    });

    return {
      period: {
        month: now.toLocaleString('default', { month: 'long', year: 'numeric' }),
        from: monthStart,
        to: monthEnd,
      },
      production: {
        batchesCompleted: productionBatches,
        totalProduced: totalProduced._sum.producedQty || 0,
      },
      service: {
        totalOrders: serviceOrders,
        completedOrders: completedServiceOrders,
        completionRate: serviceOrders > 0 ? ((completedServiceOrders / serviceOrders) * 100).toFixed(2) : 0,
      },
      inventory: {
        lowStockMaterials: lowStockCount,
        totalActiveMaterials: materials.length,
      },
      users: {
        activeUsers,
      },
    };
  }
}
