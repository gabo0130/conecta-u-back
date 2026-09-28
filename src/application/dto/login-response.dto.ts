import type { SessionUserResponse } from '../mappers/user-response.mapper';

export interface LoginResponseDto {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: SessionUserResponse;
}
