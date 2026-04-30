import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity } from 'typeorm';

@Entity('profile')
export class ProfileDTO {
  @ApiProperty({ type: 'string', nullable: true })
  avatarUrl: string | null;

  @ApiProperty({ type: 'string', nullable: true })
  email: string | null;

  @ApiProperty({ type: 'string', nullable: true })
  username: string | null;

  @ApiProperty({ type: 'string' })
  phone: string;
}
