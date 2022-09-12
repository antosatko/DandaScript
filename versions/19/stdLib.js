class DNDSStdLib{
    constructor(DNDSInterpret){
        this.comp = DNDSInterpret
        this.functions = {
            "time[const:none]": (data) => Date.now(),
            "pow[number:number;number:exponent]": (data) => Math.pow(data.number, data.exponent),
            "delay[number:duration]":(data) => {
                let start = Date.now()
                while(Date.now() - start < data.duration){ }
            }
        }
        this.dataTypes = {
            jsFunction: class {
                constructor(name, value, interpret = {}) {
                    this.interpret = interpret
                    this.name = name.substring(0, name.indexOf("["))
                    this.params = name.substring(name.indexOf("[") + 1, name.length - 1).split(";")
                    if (this.params[1] !== "")
                        for (let i in this.params)
                            this.params[i] = this.params[i].split(":")
                    else this.params = []
                    this.value = value
                }
                read(params) {
                    let memory = {}
                    for (let i in this.params){
                        this.interpret.write(this.params[i][0], this.params[i][1], params[i], memory)
                    }
                    for(let i in memory){
                        memory[i] = memory[i].read()
                    }
                    return this.value(memory)
                }
                set(params) {
                    console.error("stdFunction cannot be rewritten")
                }
            },
        }
        this.link()
    }
    link(){
        this.comp.write("object", "std", {})
        for(let i in this.functions){
            let assign = new this.dataTypes.jsFunction(i, this.functions[i], this.comp)
            this.comp.memory.std.containes[assign.name] = assign
        }
    }
}