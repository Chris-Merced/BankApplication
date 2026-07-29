import bcrypt from 'bcryptjs';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import { UnauthorizedError } from '../errors/AppError';
import { PublicUser, toPublicUser } from '../models/user';
import userRepository from '../repositories/userRepository';
import UserService from './UserService';

const TOKEN_LIFETIME = '1h';
const TOKEN_ISSUER = 'bank-application-api';
const TOKEN_AUDIENCE = 'bank-application-client';

export interface AuthResult {
  user: PublicUser;
  token: string;
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET must be set to at least 32 characters');
  }
  return secret;
}

function issueToken(userId: ObjectId): string {
  return jwt.sign(
    {
      sub: userId.toHexString(),
      type: 'access',
    },
    getJwtSecret(),
    {
      expiresIn: TOKEN_LIFETIME,
      issuer: TOKEN_ISSUER,
      audience: TOKEN_AUDIENCE,
    },
  );
}

export function verifyToken(token: string): ObjectId {
  let payload: JwtPayload | string;
  try {
    payload = jwt.verify(token, getJwtSecret(), {
      issuer: TOKEN_ISSUER,
      audience: TOKEN_AUDIENCE,
    });
  } catch {
    throw new UnauthorizedError('Invalid or expired access token');
  }

  if (
    typeof payload === 'string' ||
    payload.type !== 'access' ||
    typeof payload.sub !== 'string'
  ) {
    throw new UnauthorizedError('Invalid access token');
  }

  if (!ObjectId.isValid(payload.sub)) {
    throw new UnauthorizedError('Invalid access token');
  }
  return new ObjectId(payload.sub);
}

async function register(
  name: string,
  email: string,
  password: string,
): Promise<AuthResult> {
  const user = await UserService.createUser(name, email, password);
  return {
    user: toPublicUser(user),
    token: issueToken(user._id),
  };
}

async function login(email: string, password: string): Promise<AuthResult> {
  const user = await userRepository.findByEmail(email);
  if (
    !user ||
    user.status !== 'ACTIVE' ||
    !(await bcrypt.compare(password, user.hash_password))
  ) {
    throw new UnauthorizedError('Invalid email or password');
  }

  return {
    user: toPublicUser(user),
    token: issueToken(user._id),
  };
}

export function assertAuthConfigured(): void {
  getJwtSecret();
}

export default { register, login };
