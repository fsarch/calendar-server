import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';
// 'rrule' ships no package.json "exports" map, so under real Node ESM the named
// import `{ RRule }` cannot be resolved from its CJS build - go through the default export instead.
import RRulePkg from 'rrule';

const { RRule } = RRulePkg;

export function IsValidRRule(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isValidRRule',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'string' || value.trim() === '') {
            return false;
          }
          try {
            RRule.fromString(value);
            return true;
          } catch (e) {
            return false;
          }
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid RRULE string (RFC 5545)`;
        },
      },
    });
  };
}
