/* eslint-disable linebreak-style */
import Resource from '../core/resource/Resource.js';

class MediaResource extends Resource {
    constructor() {
        super().load(this);
    }

    /**
     * Transform the resource into custom object.
     * @return object
     */
    toArray(data) {
        return {
            name: data.name,
            url: data.url,
        };
    }
}

export default MediaResource;
