import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { CreateContractorDto } from './dto/create-contractor.dto';
import { UpdateContractorDto } from './dto/update-contractor.dto';import { PrismaService} from '../../prisma/prisma.service';


@Injectable()
export class ContractorsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateContractorDto) {
    const contractor = await this.prisma.contractor.create({
      data: {
        name: dto.name,
        type: dto.type,
        inn: dto.inn,
        kpp: dto.kpp,
        address: dto.address,
        phone: dto.phone,
        email: dto.email,
        contactPerson: dto.contactPerson,
        isActive: dto.isActive ?? true,
      },
    });

    return contractor;
  }

  async findAll(type?: string) {
    const where: any = {};

    if (type) {
      where.OR = [{ type }, { type: 'BOTH' }];
    }

    return this.prisma.contractor.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: number) {
    const contractor = await this.prisma.contractor.findUnique({
      where: { id },
    });

    if (!contractor) {
      throw new NotFoundException('Contractor not found');
    }

    return contractor;
  }

  async update(id: number, dto: UpdateContractorDto) {
    const contractor = await this.prisma.contractor.findUnique({ where: { id } });

    if (!contractor) {
      throw new NotFoundException('Contractor not found');
    }

    return this.prisma.contractor.update({
      where: { id },
      data: dto,
    });
  }

  async delete(id: number) {
    const contractor = await this.prisma.contractor.findUnique({ where: { id } });

    if (!contractor) {
      throw new NotFoundException('Contractor not found');
    }

    await this.prisma.contractor.delete({ where: { id } });

    return { message: 'Contractor deleted successfully' };
  }
}
