import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
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
        isActive: true,
      },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    // Получаем роли
    const roles = user.roles
      ?.filter(ur => ur.role)
      .map(ur => ur.role.name) || [];
          // Генерируем JWT токен
    const payload = { 
      sub: user.id, 
      email: user.email,
      roles,
    };
    const access_token = await this.jwtService.signAsync(payload);

    // Возвращаем токен + данные пользователя
    return {
      access_token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles,
      },
    };
  }

  async login(dto: LoginDto) {
    // Находим пользователя
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Проверяем активность
    if (!user.isActive) {
      throw new UnauthorizedException('User account is disabled');
    }

    // Проверяем пароль
    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Получаем роли
    const roles = user.roles
      ?.filter(ur => ur.role)
      .map(ur => ur.role.name) || [];

    // Генерируем JWT токен
    const payload = { 
      sub: user.id, 
      email: user.email,
      roles,
    };
    const access_token = await this.jwtService.signAsync(payload);

    return {
      access_token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles,
      },
    };
  }

  async getMe(userId: number) {
  const user = await this.prisma.user.findUnique({
    where: { id: userId },
    include: {
      roles: {
        include: {
          role: true,
        },
      },
    },
  });

  if (!user) {
    throw new UnauthorizedException('User not found');
  }

  // Получаем роли
  const roles = user.roles
    ?.filter(ur => ur.role)
    .map(ur => ur.role.name) || [];

  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    roles,
  };
}

}

