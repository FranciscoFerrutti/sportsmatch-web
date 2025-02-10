export interface Club {
    id: number;
    name: string;
    phoneNumber: string;
    email: string;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface SignupData {
    name: string;
    phoneNumber: string;
    email: string;
    password: string;
    confirmPassword: string;
}
