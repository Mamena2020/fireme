// eslint-disable-next-line max-classes-per-file
class Media {
    constructor(id, url, path) {
        this.id = id;
        this.url = url;
        this.path = path;
    }

    set setId(id) {
        this.id = id;
    }

    set setUrl(url) {
        this.url = url;
    }

    set setPath(path) {
        this.path = path;
    }
}
export default class MediaService {

}

export {
    Media,
};
