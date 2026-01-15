import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    });
  }

  async validate(payload: any) {
    console.log('🔑 JWT Payload validated:', { sub: payload.sub, email: payload.email, roles: payload.roles });
    
    if (!payload.sub) {
      throw new UnauthorizedException('Invalid token payload');
    }

    return { 
      id: payload.sub,
      userId: payload.sub,
      email: payload.email,
      roles: payload.roles || [],
    };
  }
}
