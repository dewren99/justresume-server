import { UsernamePasswordInput } from "../resolvers/UsernamePasswordInput"

export default function validateRegister(options: UsernamePasswordInput) {
    if(!options.firstName) {
        return  [
            {
                field: 'firstName',
                message: 'First name cannot be empty'
            }
        ];
    }
    if(!options.lastName) {
        return  [
            {
                field: 'lastName',
                message: 'Last name cannot be empty'
            }
        ];
    }
    if(options.username.length <= 2) {
        return  [
            {
                field: 'username',
                message: 'invalid username length'
            }
        ];
    }
    if(!options.email.includes('@')) {
        return  [
            {
                field: 'email',
                message: 'invalid email'
            }
        ];
    }
    if(options.username.includes('@')) {
        return [
            {
                field: 'username',
                message: 'username cannot include "@" symbol'
            }
        ];
    }
    if(options.password.length <= 2) {
        return [
            {
                field: 'password',
                message: 'invalid password length'
            }
        ];
    }
    return null;
}