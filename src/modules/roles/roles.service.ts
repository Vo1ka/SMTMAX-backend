import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateRoleDto) {
    // Проверка на существование роли
    const existingRole = await this.prisma.role.findUnique({
      where: { name: dto.name },
    });

    if (existingRole) {
      throw new ConflictException('Role with this name already exists');
    }

    // Создание роли
    const role = await this.prisma.role.create({
      data: {
        name: dto.name,
        description: dto.description,
        permissions: dto.permissions,
      },
    });

    return role;
  }

  async findAll() {
    return this.prisma.role.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: number) {
    const role = await this.prisma.role.findUnique({
      where: { id },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    return role;
  }

  async update(id: number, dto: UpdateRoleDto) {
    // Проверка существования роли
    const role = await this.prisma.role.findUnique({ where: { id } });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    // Обновление роли
    const updatedRole = await this.prisma.role.update({
      where: { id },
      data: {
        description: dto.description,
        permissions: dto.permissions,
      },
    });

    return updatedRole;
  }

  async delete(id: number) {
    // Проверка существования роли
    const role = await this.prisma.role.findUnique({ where: { id } });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    // Проверка, что роль не используется
    const usersWithRole = await this.prisma.userRole.count({
      where: { roleId: id },
    });

    if (usersWithRole > 0) {
      throw new ConflictException('Cannot delete role that is assigned to users');
    }

    // Удаление роли
    await this.prisma.role.delete({ where: { id } });

    return { message: 'Role deleted successfully' };
  }
}
