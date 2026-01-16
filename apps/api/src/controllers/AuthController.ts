import { Controller, Post, Route, Body, SuccessResponse, Res } from 'tsoa';
import type { TsoaResponse } from 'tsoa';
import { AuthService } from '../services/AuthService';

interface LoginRead {
  email: string;
  password: string;
}

interface RegisterRead {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

@Route('auth')
export class AuthController extends Controller {
  @Post('login')
  @SuccessResponse('200', 'OK')
  public async login(
    @Body() requestBody: LoginRead,
    @Res() unauthorizedResponse: TsoaResponse<401, { reason: string }>
  ): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      return await new AuthService().login(requestBody.email, requestBody.password);
    } catch (e: any) {
      console.error('Login Error:', e);
      if (e.statusCode === 401) {
        return unauthorizedResponse(401, { reason: e.message });
      }
      throw e;
    }
  }

  @Post('register')
  @SuccessResponse('201', 'Created')
  public async register(
    @Body() requestBody: RegisterRead,
    @Res() conflictResponse: TsoaResponse<409, { reason: string }>
  ): Promise<any> {
    try {
      this.setStatus(201);
      return await new AuthService().register(requestBody);
    } catch (e: any) {
      if (e.statusCode === 409) {
        return conflictResponse(409, { reason: e.message });
      }
      throw e;
    }
  }

  @Post('refresh-token')
  public async refreshToken(
    @Body() requestBody: { refreshToken: string }
  ): Promise<{ accessToken: string }> {
    return new AuthService().refreshToken(requestBody.refreshToken);
  }
}
