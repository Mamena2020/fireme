/* eslint-disable linebreak-style */
import Resource from '../core/resource/Resource.js';
import MediaResource from './MediaResource.js';

class UserResource extends Resource {
    constructor() {
        super().load(this);
    }

    /**
     * Transform the resource into custom object.
     * @return object
     */
    toArray(data) {
        return {
            id: data.id,
            name: data.name,
            email: data.email,
            role: data.getRole()?.name ?? null,
            media: new MediaResource().collection(data.getMedia()),
        };
    }
}

export default UserResource;
