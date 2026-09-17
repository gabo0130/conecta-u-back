import { BcryptPasswordHasherService } from './bcrypt-password-hasher.service';

describe('BcryptPasswordHasherService', () => {
  const service = new BcryptPasswordHasherService();

  it('hashes and compares password correctly', async () => {
    const hash = await service.hash('Secret123*');

    await expect(service.compare('Secret123*', hash)).resolves.toBe(true);
    await expect(service.compare('wrong', hash)).resolves.toBe(false);
  });
});
