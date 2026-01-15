import { Module } from '@nestjs/common';
import { RecipesService } from './recipes.service';
import { RecipesController } from './recipes.controller';
import { MaterialsModule } from '../materials/materials.module';
import { PrismaModule } from 'prisma/prisma.module';

@Module({
  imports: [PrismaModule, MaterialsModule],
  providers: [RecipesService],
  controllers: [RecipesController],
  exports: [RecipesService],
})
export class RecipesModule {}
