class DNDS_HTML_Input {
    constructor(DNDSInterpret) {
        this.comp = DNDSInterpret
        this.comp.tokens.HTMLInput = {
            "keys ": this.keys,
            "keysDown ": this.keysDown,
            "keysUp ": this.keysUp,
            "mouseClick": this.mouseClick,
            "mouseMove": this.mouseMove
        }
        this.assigned = {}
    }
    keys = (left, right) => {
        let keys = left.split(" ")
        addEventListener("keydown", e => {
            if (keys.indexOf(e.code) != -1 || left.indexOf("all") != -1) {
                let memory = {}
                this.comp.write("string", "name", e.code, memory)
                this.comp.write("string", "down", "true", memory)
                this.comp.readCode("code", right, memory)
            }
        })
        addEventListener("keyup", e => {
            if (keys.indexOf(e.code) != -1 || left.indexOf("all") != -1) {
                let memory = {}
                this.comp.write("string", "name", e.code, memory)
                this.comp.write("string", "down", "false", memory)
                this.comp.readCode("code", right, memory)
            }
        })
    }
    keysDown = (left, right) => {
        let keys = left.split(" ")
        addEventListener("keydown", e => {
            if (keys.indexOf(e.code) != -1 || left.indexOf("all") != -1) {
                let memory = {}
                this.comp.write("string", "name", e.code, memory)
                this.comp.readCode("code", right, memory)
            }
        })
    }
    keysUp = (left, right) => {
        let keys = left.split(" ")
        addEventListener("keyup", e => {
            if (keys.indexOf(e.code) != -1 || left.indexOf("all") != -1) {
                let memory = {}
                this.comp.write("string", "name", e.code, memory)
                this.comp.readCode("code", right, memory)
            }
        })
    }
    mouseClick = (left, right) => {
        addEventListener("mousedown", e => {
            let memory = {}
            this.comp.write("string", "button", e.button + "", memory)
            this.comp.write("string", "down", "true", memory)
            this.comp.write("number", "offsetX", e.offsetX, memory)
            this.comp.write("number", "offsetY", e.offsetY, memory)
            this.comp.readCode("code", right, memory)
        })
        addEventListener("mouseup", e => {
            let memory = {}
            this.comp.write("number", "button", e.button, memory)
            this.comp.write("string", "down", "false", memory)
            this.comp.write("number", "offsetX", e.offsetX, memory)
            this.comp.write("number", "offsetY", e.offsetY, memory)
            this.comp.readCode("code", right, memory)
        })
    }
    mouseMove = (left, right) => {
        addEventListener("mousemove", e => {
            let memory = {}
            this.comp.write("number", "offsetX", e.offsetX, memory)
            this.comp.write("number", "offsetY", e.offsetY, memory)
            this.comp.readCode("code", right, memory)
        })
    }
}