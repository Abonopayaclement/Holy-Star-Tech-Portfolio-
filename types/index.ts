export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "USER";
  avatarUrl?: string;
}
