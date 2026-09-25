import { CollaboratorsController } from './collaborators.controller';
import type { AuthenticatedRequest } from '../guards/jwt-auth.guard';

function mockUseCase() {
  return { execute: jest.fn() };
}

describe('CollaboratorsController', () => {
  const createMyCollaboratorProfileUseCase = mockUseCase();
  const getMyCollaboratorProfileUseCase = mockUseCase();
  const updateMyCollaboratorProfileUseCase = mockUseCase();
  const listMyCollaboratorSkillsUseCase = mockUseCase();
  const addMyCollaboratorSkillUseCase = mockUseCase();
  const updateMyCollaboratorSkillUseCase = mockUseCase();
  const deleteMyCollaboratorSkillUseCase = mockUseCase();
  const createMyExperienceUseCase = mockUseCase();
  const updateMyExperienceUseCase = mockUseCase();
  const deleteMyExperienceUseCase = mockUseCase();
  const updateMyAvailabilityUseCase = mockUseCase();

  const controller = new CollaboratorsController(
    createMyCollaboratorProfileUseCase as never,
    getMyCollaboratorProfileUseCase as never,
    updateMyCollaboratorProfileUseCase as never,
    listMyCollaboratorSkillsUseCase as never,
    addMyCollaboratorSkillUseCase as never,
    updateMyCollaboratorSkillUseCase as never,
    deleteMyCollaboratorSkillUseCase as never,
    createMyExperienceUseCase as never,
    updateMyExperienceUseCase as never,
    deleteMyExperienceUseCase as never,
    updateMyAvailabilityUseCase as never,
  );

  const request = {
    user: { userId: '1', role: 'COLABORADOR' },
  } as AuthenticatedRequest;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('delegates createMe to use case', () => {
    const dto = { firstName: 'Ana' };
    void controller.createMe(request, dto as never);
    expect(createMyCollaboratorProfileUseCase.execute).toHaveBeenCalledWith(
      '1',
      dto,
    );
  });

  it('delegates getMe to use case', () => {
    void controller.getMe(request);
    expect(getMyCollaboratorProfileUseCase.execute).toHaveBeenCalledWith('1');
  });

  it('delegates updateMe to use case', () => {
    const dto = { lastName: 'Gómez' };
    void controller.updateMe(request, dto);
    expect(updateMyCollaboratorProfileUseCase.execute).toHaveBeenCalledWith(
      '1',
      dto,
    );
  });

  it('delegates listSkills to use case', () => {
    void controller.listSkills(request);
    expect(listMyCollaboratorSkillsUseCase.execute).toHaveBeenCalledWith('1');
  });

  it('delegates addSkill to use case', () => {
    const dto = { skillId: 's1' };
    void controller.addSkill(request, dto as never);
    expect(addMyCollaboratorSkillUseCase.execute).toHaveBeenCalledWith(
      '1',
      dto,
    );
  });

  it('delegates updateSkill to use case', () => {
    const dto = { skillId: 's1' };
    void controller.updateSkill(request, 'cs1', dto as never);
    expect(updateMyCollaboratorSkillUseCase.execute).toHaveBeenCalledWith(
      '1',
      'cs1',
      dto,
    );
  });

  it('delegates deleteSkill to use case', () => {
    void controller.deleteSkill(request, 'cs1');
    expect(deleteMyCollaboratorSkillUseCase.execute).toHaveBeenCalledWith(
      '1',
      'cs1',
    );
  });

  it('delegates createExperience to use case', () => {
    const dto = { role: 'Dev' };
    void controller.createExperience(request, dto as never);
    expect(createMyExperienceUseCase.execute).toHaveBeenCalledWith('1', dto);
  });

  it('delegates updateExperience to use case', () => {
    const dto = { role: 'Dev' };
    void controller.updateExperience(request, 'e1', dto as never);
    expect(updateMyExperienceUseCase.execute).toHaveBeenCalledWith(
      '1',
      'e1',
      dto,
    );
  });

  it('delegates deleteExperience to use case', () => {
    void controller.deleteExperience(request, 'e1');
    expect(deleteMyExperienceUseCase.execute).toHaveBeenCalledWith('1', 'e1');
  });

  it('delegates updateAvailability to use case', () => {
    const dto = { availabilityStatus: 'DISPONIBLE', weeklyHours: 10 };
    void controller.updateAvailability(request, dto as never);
    expect(updateMyAvailabilityUseCase.execute).toHaveBeenCalledWith('1', dto);
  });
});
