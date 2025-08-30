export class HexArray {
    constructor(input) {
        this.array = [];
        this.rowMinQ = input.rowMinQ;
        this.minR = input.minR;
        try {
            for (const hex of input.hexList) {
                const r = hex.r;
                const rIndex = r - this.minR;
                let arrayOfR = this.array[rIndex];
                if (arrayOfR === undefined) {
                    arrayOfR = [];
                    this.array[rIndex] = arrayOfR;
                }
                const q = hex.q;
                const aRowMinQ = this.rowMinQ.get(r);
                const qIndex = q - aRowMinQ;
                arrayOfR[qIndex] = hex;
            }
        } catch (e) {
            throw new Error(`[HexArray] ${taggedString.hexArrayFailedToCreate(e)}`);
        }
    }

    toArray(input) {
        return this.array.flat();
    };

    get(input) {
        try {
            const { q, r, } = input;
            const rIndex = r - this.minR;
            const arrayOfR = this.array[rIndex];
            const aRowMinQ = this.rowMinQ.get(r);
            const qIndex = q - aRowMinQ;
            const hex = arrayOfR[qIndex];
            return { hex, };
        } catch (e) {
            throw new Error(`[HexArray] ${taggedString.hexArrayFailedToGet(q, r, e)}`);
        }
    };

    getByKey(input) {
        try {
            const key = input.key;
            const { q, r, } = window.OPRSClasses.Hex.decode({ key, });
            return this.get({ q, r, });
        } catch (e) {
            throw new Error(`[HexArray] ${taggedString.hexArrayFailedToGetByKey(key, e)}`);
        }
    };
}