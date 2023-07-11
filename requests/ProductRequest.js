/* eslint-disable linebreak-style */
import RequestValidation from '../core/validation/RequestValidation.js';

class ProductRequest extends RequestValidation {
    constructor(req) {
        super(req).load(this);
    }

    /**
     * Get the validation rules that apply to the request.
     * @returns object
     */
    rules() {
        return {
            name: {
                rule: ['required', 'unique:products,name'],
            },
            price: {
                rules: ['required', 'integer'],
            },
        };
    }
}

export default ProductRequest;
