import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    // Создаем пользователя
    const user = await this.usersService.create({
      email: dto.email,
      password: dto.password,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone,
    });

    // Генерируем токены
    const tokens = await this.generateTokens(user.id, user.email, []);

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: [],
      },
    };
  }

  async login(dto: LoginDto) {
    // Находим пользователя
    const user = await this.usersService.findByEmail(dto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Проверяем активность
    if (!user.isActive) {
      throw new UnauthorizedException('User account is disabled');
    }

    // Проверяем пароль
    const isPasswordValid = await this.usersService.validatePassword(
      dto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Получаем роли
    const roles = user.roles.map((ur) => ur.role.name);

    // Генерируем токены
    const tokens = await this.generateTokens(user.id, user.email, roles);

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles,
      },
    };
  }

  async refresh(refreshToken: string) {
    // Проверяем токен в БД
    const tokenRecord = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });

    if (!tokenRecord) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Проверяем срок действия
    if (new Date() > tokenRecord.expiresAt) {
      await this.prisma.refreshToken.delete({
        where: { id: tokenRecord.id },
      });
      throw new UnauthorizedException('Refresh token expired');
    }

    // Получаем пользователя
    const user = await this.usersService.findById(tokenRecord.userId);

    if (!user.isActive) {
      throw new UnauthorizedException('User account is disabled');
    }

    // Получаем роли
    const roles = user.roles.map((ur) => ur.role.name);

    // Удаляем старый refresh token
    await this.prisma.refreshToken.delete({
      where: { id: tokenRecord.id },
    });

    // Генерируем новые токены
    const tokens = await this.generateTokens(user.id, user.email, roles);

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles,
      },
    };
  }

  async logout(refreshToken: string) {
    await this.prisma.refreshToken.deleteMany({
      where: { token: refreshToken },
    });

    return { message: 'Logged out successfully' };
  }

  async getMe(userId: number) {
    const user = await this.usersService.findById(userId);

    const roles = user.roles.map((ur) => ur.role.name);

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      isActive: user.isActive,
      roles,
    };
  }

  private async generateTokens(userId: number, email: string, roles: string[]) {
    const payload = {
      sub: userId,
      email,
      roles,
    };

    // Access token (15 минут)
    const accessToken = await this.jwtService.signAsync(payload);

    // Refresh token (7 дней)
    const refreshTokenPayload = { sub: userId };
    const refreshToken = await this.jwtService.signAsync(refreshTokenPayload, {
      expiresIn: '7d',
    });

    // Сохраняем refresh token в БД
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 дней

    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
    };
  }
}
