export interface TeamCategory {
  _id: string;
  id?: string;
  name: string;
  slug: string;
  description?: string | null;
  displayOrder: number;
  isActive: boolean;
}

export interface TeamMemberMedia {
  publicId: string;
  url: string;
}

export interface TeamMember {
  _id: string;
  id?: string;
  categoryId: string | TeamCategory;
  name: string;
  designation: string;
  biography?: string | null;
  profileMedia?: TeamMemberMedia | null;
  linkedinUrl?: string | null;
  githubUrl?: string | null;
  portfolioUrl?: string | null;
  displayOrder: number;
  isPublished: boolean;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface PublicTeamCategoryGroup {
  id: string;
  name: string;
  slug: string;
  description?: string;
  displayOrder: number;
  members: TeamMember[];
}

export interface PublicTeamResponse {
  categories: PublicTeamCategoryGroup[];
  totalMembers: number;
}
