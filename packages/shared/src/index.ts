export { UserRole } from './enums/user-role';
export { OrderType } from './enums/order-type';
export { OrderStatus } from './enums/order-status';
export { PaymentMethod } from './enums/payment-method';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}
