import { FindOptionsWhere, Not, Repository } from 'typeorm';
import { ApiErrorCode, ApiException } from './api-error';

export async function checkUniqueFields<T extends { id: string }>(
  repository: Repository<T>,
  excludeId: string,
  fields: object,
): Promise<void> {
  const taken: string[] = [];

  await Promise.all(
    Object.entries(fields).map(async ([field, value]) => {
      if (value === undefined || value === null) return;

      const exists = await repository.existsBy({
        [field]: value,
        id: Not(excludeId),
      } as FindOptionsWhere<T>);

      if (exists) taken.push(field);
    }),
  );

  if (taken.length > 0) {
    throw new ApiException(ApiErrorCode.UNIQUE_FIELDS_TAKEN, { fields: taken });
  }
}
