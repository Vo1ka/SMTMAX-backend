import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { RolesModule } from './modules/roles/roles.module';
import { MaterialsModule } from './modules/materials/materials.module';
import { RecipesModule } from './modules/recipes/recipes.module';
import { ProductionModule } from './modules/production/production.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { ContractorsModule } from './modules/contractors/contractors.module';
import { ServiceModule } from './modules/service/service.module';
import { ReportsModule } from './modules/reports/reports.module';
import { HealthModule } from './modules/health/health.module';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';
import { PrismaModule } from 'prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, jwtConfig],
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    RolesModule,
    MaterialsModule,
    RecipesModule,
    ProductionModule,
    InventoryModule,
    ContractorsModule,
    ServiceModule,
    ReportsModule,
    HealthModule,
  ],
})
export class AppModule {}
