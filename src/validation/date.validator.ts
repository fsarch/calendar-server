import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

export function IsDate(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isDate',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          // Check if value is a Date object and is valid
          if (value instanceof Date) {
            // Check if the date is valid (not Invalid Date)
            return !isNaN(value.getTime());
          }
          // Also accept ISO date strings
          if (typeof value === 'string') {
            const date = new Date(value);
            return !isNaN(date.getTime());
          }
          return false;
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid Date`;
        },
      },
    });
  };
}
