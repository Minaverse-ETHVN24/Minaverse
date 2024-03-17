import { Field } from 'o1js';

export class Utilities {
    static stringArrayToFields(input: string[]): Field[] {
        const result: Field[] = [];
        for (let i = 0; i < input.length; i++) {
            result.push(Field(input[i]));
        }
        return result;
    }

    static fieldsToStringArray(input: Field[]): string[] {
        const result: string[] = [];
        for (let i = 0; i < input.length; i++) {
            result.push(input[i].toString());
        }
        return result;
    }
}
