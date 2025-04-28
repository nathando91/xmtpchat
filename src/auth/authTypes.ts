import { 
  RegistrationResponseJSON,
  AuthenticationResponseJSON 
} from '@simplewebauthn/types';

export interface User {
  id: string;
  username: string;
  currentChallenge?: string;
  registeredCredentials: RegisteredCredential[];
  ethAddress?: string;
}

export interface RegisteredCredential {
  id: string;
  publicKey: string;
  counter: number;
}

export interface RegistrationRequest {
  username: string;
}

export interface AuthenticationRequest {
  username: string;
}

export interface VerifyRegistrationRequest {
  username: string;
  response: RegistrationResponseJSON;
}

export interface VerifyAuthenticationRequest {
  username: string;
  response: AuthenticationResponseJSON;
}
