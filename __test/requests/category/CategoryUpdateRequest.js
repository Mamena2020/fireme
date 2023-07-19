/* eslint-disable linebreak-style */
import RequestValidation from '../../../core/validation/RequestValidation.js';

class CategoryUpdateRequest extends RequestValidation {
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
                rules: ['required', `unique:categories,name,${this.body.id ?? ''}`],
            },
        };
    }
}

export default CategoryUpdateRequest;
