import { ConflictException } from '@nestjs/common';
import { FindOptionsWhere, Not, Repository } from 'typeorm';

export async function checkUniqueFields<T extends { id: string }>(
  repository: Repository<T>,
  excludeId: string,
  fields: object,
): Promise<void> {
  const errors: Record<string, string> = {};

  await Promise.all(
    Object.entries(fields).map(async ([field, value]) => {
      if (value === undefined || value === null) return;

      const exists = await repository.existsBy({
        [field]: value,
        id: Not(excludeId),
      } as FindOptionsWhere<T>);

      if (exists) {
        errors[field] = `${field} already taken`;
      }
    }),
  );

  if (Object.keys(errors).length > 0) {
    throw new ConflictException(errors);
  }
}
