import { ProfilesController } from './profiles.controller';
import type { AuthenticatedRequest } from '../guards/jwt-auth.guard';

function mockUseCase() {
  return { execute: jest.fn() };
}

describe('ProfilesController', () => {
  const getMyProfileUseCase = mockUseCase();
  const updateMyProfileUseCase = mockUseCase();
  const listMySkillsUseCase = mockUseCase();
  const createSkillUseCase = mockUseCase();
  const updateSkillUseCase = mockUseCase();
  const deleteSkillUseCase = mockUseCase();
  const createExperienceUseCase = mockUseCase();
  const updateExperienceUseCase = mockUseCase();
  const deleteExperienceUseCase = mockUseCase();
  const updateAvailabilityUseCase = mockUseCase();

  const controller = new ProfilesController(
    getMyProfileUseCase as never,
    updateMyProfileUseCase as never,
    listMySkillsUseCase as never,
    createSkillUseCase as never,
    updateSkillUseCase as never,
    deleteSkillUseCase as never,
    createExperienceUseCase as never,
    updateExperienceUseCase as never,
    deleteExperienceUseCase as never,
    updateAvailabilityUseCase as never,
  );

  const request = {
    user: { userId: '1', role: 'COLABORADOR' },
  } as AuthenticatedRequest;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('delegates getMe to use case', () => {
    void controller.getMe(request);
    expect(getMyProfileUseCase.execute).toHaveBeenCalledWith('1');
  });

  it('delegates updateMe to use case', () => {
    const dto = { headline: 'x' };
    void controller.updateMe(request, dto);
    expect(updateMyProfileUseCase.execute).toHaveBeenCalledWith('1', dto);
  });

  it('delegates listSkills to use case', () => {
    void controller.listSkills(request);
    expect(listMySkillsUseCase.execute).toHaveBeenCalledWith('1');
  });

  it('delegates createSkill to use case', () => {
    const dto = { name: 'React', type: 'CONOCIMIENTO' as const };
    void controller.createSkill(request, dto);
    expect(createSkillUseCase.execute).toHaveBeenCalledWith('1', dto);
  });

  it('delegates updateSkill to use case', () => {
    const dto = { name: 'React', type: 'CONOCIMIENTO' as const };
    void controller.updateSkill(request, 's1', dto);
    expect(updateSkillUseCase.execute).toHaveBeenCalledWith('1', 's1', dto);
  });

  it('delegates deleteSkill to use case', () => {
    void controller.deleteSkill(request, 's1');
    expect(deleteSkillUseCase.execute).toHaveBeenCalledWith('1', 's1');
  });

  it('delegates createExperience to use case', () => {
    const dto = { title: 'Dev' };
    void controller.createExperience(request, dto);
    expect(createExperienceUseCase.execute).toHaveBeenCalledWith('1', dto);
  });

  it('delegates updateExperience to use case', () => {
    const dto = { title: 'Dev' };
    void controller.updateExperience(request, 'e1', dto);
    expect(updateExperienceUseCase.execute).toHaveBeenCalledWith(
      '1',
      'e1',
      dto,
    );
  });

  it('delegates deleteExperience to use case', () => {
    void controller.deleteExperience(request, 'e1');
    expect(deleteExperienceUseCase.execute).toHaveBeenCalledWith('1', 'e1');
  });

  it('delegates updateAvailability to use case', () => {
    const dto = { availabilityStatus: 'PARCIAL' as const };
    void controller.updateAvailability(request, dto);
    expect(updateAvailabilityUseCase.execute).toHaveBeenCalledWith('1', dto);
  });
});
