export interface Club {
    id: number;
    name: string;
    phoneNumber: string;
    email: string;
    description: string;
    imageUrl?: string
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface SignupData {
    name: string;
    phoneNumber: string;
    email: string;
    description: string;
    password: string;
    confirmPassword: string;
}
