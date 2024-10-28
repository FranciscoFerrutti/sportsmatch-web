// src/types/auth.ts
export interface Club {
    id: number;
    name: string;
    description: string;
    address: string;
    postalCode: string;
    phone: string;
    email: string;
  }
  
  export interface LoginCredentials {
    email: string;
    password: string;
  }
  
  export interface SignupData extends Omit<Club, 'id'> {
    password: string;
    confirmPassword: string;
  }