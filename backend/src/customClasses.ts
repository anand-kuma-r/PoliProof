class TwoWayMap<T> extends Map<T, T> {
    private locked : boolean = false;
    constructor() {
        super();
    }

    private async acquireLock(): Promise<void> {
    while (this.locked) {
        await new Promise(resolve => setTimeout(resolve, 10));
    }
    this.locked = true;
    }
    
    private releaseLock(): void {
    this.locked = false;
    }

    private async runWithLock<R>(operation: () => R | Promise<R>): Promise<R> {
        await this.acquireLock();
        try {
            return await Promise.resolve(operation());
        } finally {
            this.releaseLock();
        }
    }

    set(key1 : T, key2 : T) {
        super.set(key1, key2);
        super.set(key2, key1);
        return this;
    }

    remove(key : T) : boolean{
        if (!super.has(key)) {
            return false;
        }
        const pairKey = super.get(key);
        super.delete(key);
        if (pairKey) {
            super.delete(pairKey);
        }
        return true;
    }

    get(key : T) : T | undefined {
        return super.get(key);
    }

    destroy() {
        super.clear();
    }
}

export { TwoWayMap };