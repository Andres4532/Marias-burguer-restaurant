import {
  registerDecorator,
  type ValidationOptions,
} from 'class-validator';

export function normalizeLoginIdentifier(value: string): string {
  return value.trim().toLowerCase();
}

export function isValidLoginIdentifier(value: unknown): boolean {
  if (typeof value !== 'string') return false;

  const trimmed = value.trim();
  if (trimmed.length < 3 || trimmed.length > 64) return false;

  if (trimmed.includes('@')) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
  }

  return /^[a-zA-Z0-9._-]+$/.test(trimmed);
}

export function IsLoginIdentifier(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isLoginIdentifier',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          return isValidLoginIdentifier(value);
        },
        defaultMessage() {
          return 'Ingresa un correo válido o un usuario de 3–64 caracteres (letras, números, . _ -)';
        },
      },
    });
  };
}
