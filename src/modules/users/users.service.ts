import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import { QueryUsersDto } from './dto/query-roles.dto';
import { PrismaService} from '../../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateUserDto) {
    // Проверка на существование пользователя
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Хеширование пароля
    const passwordHash = await bcrypt.hash(dto.password, 10);

    // Создание пользователя
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        isActive: dto.isActive ?? true,
      },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    return this.formatUser(user);
  }

  async findAll(query: QueryUsersDto) {
  const { page = 1, limit = 20, search, isActive, sortBy = 'createdAt', sortOrder = 'desc' } = query;

  const skip = (page - 1) * limit;

  // Построение фильтров
  const where: any = {};

  if (search) {
    where.OR = [
      { email: { contains: search, mode: 'insensitive' } },
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (isActive !== undefined) {
    where.isActive = isActive === 'true';
  }

  // Безопасная сортировка
  const orderBy: any = {};
  orderBy[sortBy] = sortOrder;

  // Получение данных
  const [users, total] = await Promise.all([
    this.prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    }),
    this.prisma.user.count({ where }),
  ]);

  return {
    data: users.map((user) => this.formatUser(user)),
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}


  async findById(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.formatUser(user);
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  async update(id: number, dto: UpdateUserDto) {
    // Проверка существования пользователя
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Проверка email на уникальность
    if (dto.email && dto.email !== user.email) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });

      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }
    }

    // Подготовка данных для обновления
    const updateData: any = {
      email: dto.email,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone,
      isActive: dto.isActive,
    };

    // Хеширование нового пароля
    if (dto.password) {
      updateData.passwordHash = await bcrypt.hash(dto.password, 10);
    }

    // Обновление пользователя
    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    return this.formatUser(updatedUser);
  }

  async delete(id: number) {
    // Проверка существования пользователя
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Удаление пользователя (каскадно удалятся UserRole)
    await this.prisma.user.delete({ where: { id } });

    return { message: 'User deleted successfully' };
  }

  async assignRole(userId: number, roleId: number) {
    // Проверка существования пользователя
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Проверка существования роли
    const role = await this.prisma.role.findUnique({ where: { id: roleId } });
    if (!role) {
      throw new NotFoundException('Role not found');
    }

    // Проверка, не назначена ли уже роль
    const existingAssignment = await this.prisma.userRole.findUnique({
      where: {
        userId_roleId: {
          userId,
          roleId,
        },
      },
    });

    if (existingAssignment) {
      throw new BadRequestException('Role already assigned to user');
    }

    // Назначение роли
    await this.prisma.userRole.create({
      data: {
        userId,
        roleId,
      },
    });

    return this.findById(userId);
  }

  async removeRole(userId: number, roleId: number) {
    // Проверка существования связи
    const userRole = await this.prisma.userRole.findUnique({
      where: {
        userId_roleId: {
          userId,
          roleId,
        },
      },
    });

    if (!userRole) {
      throw new NotFoundException('Role assignment not found');
    }

    // Удаление роли
    await this.prisma.userRole.delete({
      where: {
        userId_roleId: {
          userId,
          roleId,
        },
      },
    });

    return this.findById(userId);
  }

  async updateStatus(id: number, isActive: boolean) {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: { isActive },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    return this.formatUser(updatedUser);
  }

  async validatePassword(password: string, passwordHash: string): Promise<boolean> {
    return bcrypt.compare(password, passwordHash);
  }

  private formatUser(user: any) {
    const { passwordHash, ...userWithoutPassword } = user;
    
    return {
      ...userWithoutPassword,
      roles: user.roles.map((ur: any) => ({
        id: ur.role.id,
        name: ur.role.name,
        description: ur.role.description,
      })),
    };
  }
}
