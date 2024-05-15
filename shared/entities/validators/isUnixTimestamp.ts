import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

export default function IsUnixTimestamp(validationOptions?: ValidationOptions) {
    return function (object: any, propertyName: string) {
        registerDecorator({
            name: 'isUnixTimestamp',
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            validator: {
                validate(value: any, args: ValidationArguments) {
                    const date = new Date(value * 1000);
                    return !isNaN(date.getTime());
                },
                defaultMessage(args: ValidationArguments) {
                    return 'Timestamp ($value) is not a valid Unix timestamp';
                }
            }
        });
    };
}
