/* eslint-disable linebreak-style */
import RequestValidation from '../core/validation/RequestValidation.js';

class LoginRequest extends RequestValidation {
    constructor(req) {
        super(req).load(this);
    }

    /**
     * Get the validation rules that apply to the request.
     * @return object
     */
    rules() {
        return {
            email: {
                rules: ['required', 'email', 'exists:users,email'],
            },
            password: {
                rules: ['required'],
            },
        };
    }
}

export default LoginRequest;
