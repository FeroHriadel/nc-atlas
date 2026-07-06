export interface User {
  id: string;
  username: string;
  email: string;
  profileImageUrl: string | null;
  bio: string | null;
  role: string;
  createdAt: string;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}
