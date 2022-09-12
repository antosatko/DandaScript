class DNDSCanvas {
    constructor(DNDSInterpret, canvas2d) {
        this.comp = DNDSInterpret
        this.c = canvas2d
        this.comp.tokens.code["canvas "] = this.call
    }
    call = (left, right, memory = {}) => {
        let split = right.split(";") || undefined
        for (let i in split) {
            split[i] = this.comp.translateSingle(split[i], memory)
        }
        if (typeof this.c[left] == "function")
            this.c[left](...split)
        else
            this.c[left] = this.comp.translateSingle(right, memory)
    }
}