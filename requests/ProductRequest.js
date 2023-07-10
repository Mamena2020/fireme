import RequestValidation from '../core/validation/RequestValidation.js';

class ProductRequest extends RequestValidation {
    constructor(req) {
        super(req).load(this);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return object
     */
    rules() {
        return {
            "name": {
                "rules": ["required", "unique:products,name"]
            },
            "price": {
                "rules": ["required", "integer"]
            }
        }
    }
}

export default ProductRequest;