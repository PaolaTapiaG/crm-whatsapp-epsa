export interface CrmUser {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'secretary';
  active?: boolean;
}
