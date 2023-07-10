/**
 * Resource for handling mapping data from collections of single object
 */
class Resource {
    // constructor() {
    // }

    load(child) {
        this.child = child;
    }

    /**
     * create resources collection from an array of object
     * @param {*} list is array of object
     * @returns array
     */
    collection(list = []) {
        const newList = [];
        list.forEach((data) => {
            const newData = this.make(data);
            newList.push(newData);
        });
        return newList;
    }

    /**
     * create resource from single object
     * @param {*} data is object
     * @returns object
     */
    make(data) {
        return this.child.toArray(data);
    }
}

export default Resource;
