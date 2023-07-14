/* eslint-disable linebreak-style */
import RequestValidation from '../core/validation/RequestValidation.js';

class RegisterRequest extends RequestValidation {
    constructor(req) {
        super(req).load(this);
    }

    /**
     * Get the validation rules that apply to the request.
     * @return object
     */
    rules() {
        return {
            name: {
                rules: ['required'],
            },
            email: {
                rules: ['required', 'email', 'unique:users,email'],
            },
            password: {
                rules: ['required'],
            },
            confirm_password: {
                rules: ['required', 'match:password'],
            },
        };
    }
}

export default RegisterRequest;
