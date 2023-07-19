/* eslint-disable linebreak-style */
import RequestValidation from '../../../core/validation/RequestValidation.js';

class ProductUpdateRequest extends RequestValidation {
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
                rules: ['required', `unique:products,name,${this.body.id ?? ''}`],
            },
            category_id: {
                rules: ['required', 'exists:categories,id'],
            },
        };
    }
}

export default ProductUpdateRequest;
