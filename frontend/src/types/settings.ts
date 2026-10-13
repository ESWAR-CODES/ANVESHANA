export interface SocialLinks {
  instagram?: string | null;
  linkedin?: string | null;
  github?: string | null;
  twitter?: string | null;
  youtube?: string | null;
}

export interface ClubSettings {
  _id?: string;
  clubName: string;
  tagline: string;
  mission: string;
  contactEmail: string;
  contactPhone?: string | null;
  socialLinks: SocialLinks;
  isSingleton?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateSettingsPayload {
  contactEmail?: string;
  contactPhone?: string | null;
  socialLinks?: SocialLinks;
}
