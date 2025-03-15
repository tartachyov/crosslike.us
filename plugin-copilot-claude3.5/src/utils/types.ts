export interface UserProfile {
    id: string;
    name: string;
    profileUrl: string;
    posts: Post[];
}

export interface Post {
    id: string;
    content: string;
    liked: boolean;
}

export interface OnboardingFormData {
    email: string;
    password: string;
}

export interface SubscriptionDetails {
    cardNumber: string;
    expirationDate: string;
    cvv: string;
}