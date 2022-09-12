class DNDSConnect {
    constructor(DNDSInterpret) {
        this.assigned = {}
        this.comp = DNDSInterpret
        this.comp.tokens.code["readEx "] = this.readEx
    }
    assign(callback, name = "name") {
        this.assigned[name] = callback
    }
    read(name, ...args) {
        let data = []
        for (let i in args) {
            data[i] = args[i].toString()
        }
        return this.comp.memory[name].read(data)
    }
    readEx = (left, right, memory) => {
        let split = right.split(";")
        for (let i in split) {
            split[i] = this.comp.translateSingle(split[i], memory)
        }
        return this.assigned[left](...split)
    }
}