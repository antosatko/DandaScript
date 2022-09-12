class DNDSDebugger {
    constructor() {
        this.source
        this.memory = {}
        this.indicators = {
            duplicate: "-",
            split: "_",
            immutable: "!",
            comparison: "="
        }
        this.dataTypes = {
            number: class {
                constructor(name, value, interpret = {}, memory = {}) {
                    this.name = name
                    this.interpret = interpret
                    this.set(value, memory)
                }
                read(params, nested = {}) {
                    return this.value
                }
                set(params, nested = {}) {
                    this.value = Number(this.interpret.translateSingle(params, nested))
                    if (this.value == NaN) {
                        console.warn("Warning: Value of " + this.name + " set to NaN")
                    }
                }
            },
            string: class {
                constructor(name, value, interpret = {}, memory = {}) {
                    this.name = name
                    this.interpret = interpret
                    this.set(value, memory)
                }
                read(params) {
                    return this.value
                }
                set(params, nested = {}) {
                    this.value = String(this.interpret.translateMultiple(params, nested))
                }
            },
            sentence: class {
                constructor(name, value, interpret = {}, memory = {}) {
                    this.name = name
                    this.interpret = interpret
                    this.set(value)
                }
                read(params, nested = {}) {
                    return this.interpret.translateMultiple(this.value, nested)
                }
                set(params) {
                    this.value = params
                }
            },
            function: class {
                constructor(name, value, interpret = {}, memory = {}) {
                    this.interpret = interpret
                    this.name = name.substring(0, name.indexOf("("))
                    this.params = this.interpret.split(name.substring(name.indexOf("(") + 1, name.length - 1), ";")
                    if (this.params[1] !== "")
                        for (let i in this.params)
                            this.params[i] = this.interpret.split(this.params[i], ":")
                    if (JSON.stringify(this.params) == '[[""]]')
                        this.params = []
                    this.value = value
                }
                read(params, nested = {}) {
                    let memory = {}
                    for (let i in this.params)
                        this.interpret.write(this.params[i][0], this.params[i][1], params[i], memory)
                    let read = this.interpret.readCode("code", this.value, memory)
                    return this.interpret.translateMultiple(read, memory)
                }
                set(params) {
                    this.value = params
                }
            },
            const: class {
                constructor(name, value, interpret = {}, memory = {}) {
                    this.name = name
                    this.interpret = interpret
                    this.set(value)
                }
                read(params, nested = {}) {
                    return this.value
                }
                set(params) {
                    this.value = this.interpret.translateSingle(params)
                }
            },
            ptr: class {
                constructor(name, value, interpret = {}, memory = {}) {
                    this.name = name
                    this.interpret = interpret
                    this.value = { ...this.interpret.memory, ...memory }[value]
                }
                read(params, nested = {}) {
                    return this.value.read(params, nested)
                }
                set(params, memory = {}) {
                    this.value.set(params, memory)
                }
            },
            object: class {
                constructor(name, value, interpret = {}, memory = {}) {
                    this.name = name
                    this.interpret = interpret
                    this.value = {}
                    this.containes = {}
                    this.set(value, memory)
                }
                read(params, nested = {}) {
                    console.warn("Warning: Trying to read an object. Current version doesn´t support pointers.")
                    return "(object)"
                }
                set(params, memory = {}) {
                    if (typeof params != "object")
                        throw "Objects must be initialized directly. Copying is no supported in the current version."
                    for (let i in params) {
                        let left = i.split(" ")
                        this.interpret.write(left[0], left[1], this.interpret.translateSingle(params[i], memory), this.containes)
                    }
                    return
                }
            },
            array: class {
                constructor(name, value, interpret = {}, memory = {}) {
                    this.name = name
                    this.interpret = interpret
                    this.value = {}
                    this.containes = {}
                    this.array = []
                    this.set(value, memory)
                }
                read(params, nested = {}, path) {
                    console.log(path)
                    console.warn("Warning: Trying to read an array. Current version doesn´t support pointers.")
                    return "(array)"
                }
                set(params, memory = {}) {
                    if (typeof params != "object")
                        throw "Arrays must be initialized as an object. Copying is not supported in the current version."
                    let count = 0
                    for (let i in params) {
                        let datatype = i
                        while (datatype[0] == "-") datatype = datatype.substring(1)
                        this.interpret.write(datatype, count, this.interpret.translateSingle(params[i], memory), this.array)
                        count++
                    }
                }
            }

        }
        this.tokens = {
            code: {
                "/"(left, right) {
                    left = left.split(" ")
                    return left.length === 2 ? { write: [left[0], left[1], right] } : { rewrite: [left[0], right] }
                },
                "for "(left, right) {
                    left = [left.substring(0, left.indexOf(" ")), left.substring(left.indexOf(" ") + 1)]
                    return { repeat: [left[0], left[1], right] }
                },
                "if "(left, right) {
                    return { if: [left, right] }
                },
                "return"(left, right) {
                    return { return: right }
                },
                "console"(left, right) {
                    return { out: right }
                },
                "read"(left, right) {
                    return { read: right }
                },
                "delete"(left, right) {
                    return { delete: right }
                }
            }
        }
        this.actions = {
            write(data, memory = {}) {
                this.interpret.write(data[0], data[1], data[2], memory)
            },
            code(data, memory = {}) {
                this.interpret.readCode("code", data, memory)
            },
            rewrite(data, memory = {}) {
                this.interpret.rewrite(data[0], data[1], memory)
            },
            repeat(data, memory = {}) {
                data[1] = this.interpret.translateSingle(data[1], memory)
                this.interpret.write("number", data[0], -1, memory)
                for (let i = 0; i < data[1]; i = this.interpret.translateSingle(data[0], memory) + 1) {
                    this.interpret.rewrite(data[0], i, memory)
                    let ans = this.interpret.readCode("code", data[2], memory)
                    if (ans !== undefined && ans !== "")
                        return ans
                }
            },
            if(data, memory = {}) {
                let translated = this.interpret.translateSingle(data[0], memory)
                if (translated === "true" || translated === true) {
                    let ans = this.interpret.readCode("code", data[1], memory)
                    if (ans !== undefined)
                        return ans
                }

            },
            out(data, memory = {}) {
                console.log(this.interpret.translateMultiple(data, memory))
            },
            return(data, memory = {}) {
                return this.interpret.translateMultiple(data, memory)
            },
            read(data, memory = {}) {
                this.interpret.translateSingle(data, memory)
            },
            delete(data, memory = {}) {
                console.warn("Warning: Trying to use an unstable feature 'delete', consider other solutions")
                let path = this.interpret.followPath(data, memory)
                delete path.place.containes[path.end]
            },
            interpret: this
        }
        this.comparison = {
            "+": {
                stack: true,
                evaluate: function (a, b) {
                    let answer = ((!isNaN(a) ? Number(a) : a) + (!isNaN(b) ? Number(b) : b))
                    if (isNaN(answer))
                        console.warn("Warning: Operation " + a + " + " + b + " resulted in NaN.")
                    return answer
                }
            },
            "-": {
                stack: true,
                evaluate(a, b) {
                    let answer = ((!isNaN(a) ? Number(a) : a) - (!isNaN(b) ? Number(b) : b))
                    if (isNaN(answer))
                        console.warn("Warning: Operation " + a + " - " + b + " resulted in NaN.")
                    return answer
                }
            },
            "*": {
                stack: true,
                evaluate(a, b) {
                    let answer = ((!isNaN(a) ? Number(a) : a) * (!isNaN(b) ? Number(b) : b))
                    if (isNaN(answer))
                        console.warn("Warning: Operation " + a + " * " + b + " resulted in NaN.")
                    return answer
                }
            },
            "/": {
                stack: true,
                evaluate(a, b) {
                    let answer = ((!isNaN(a) ? Number(a) : a) / (!isNaN(b) ? Number(b) : b))
                    if (isNaN(answer))
                        console.warn("Warning: Operation " + a + " / " + b + " resulted in NaN.")
                    return answer
                }
            },
            "%": {
                stack: true,
                evaluate(a, b) {
                    let answer = ((!isNaN(a) ? Number(a) : a) % (!isNaN(b) ? Number(b) : b))
                    if (isNaN(answer))
                        console.warn("Warning: Operation " + a + " % " + b + " resulted in NaN.")
                    return answer
                }
            },
            "=": {
                stack: false,
                evaluate(a, b) {
                    return String(a) == String(b)
                }
            },
            "!=": {
                stack: false,
                evaluate(a, b) {
                    return String(a) != String(b)
                }
            },
            "<": {
                stack: false,
                evaluate(a, b) {
                    if (isNaN(a) || isNaN(b))
                        throw "Exception: Trying to do number operations on non number values: " + a + " < " + b
                    return Number(a) < Number(b)
                }
            },
            ">": {
                stack: false,
                evaluate(a, b) {
                    if (isNaN(a) || isNaN(b))
                        throw "Exception: Trying to do number operations on non number values: " + a + " > " + b
                    return Number(a) > Number(b)
                }
            },
            "<=": {
                stack: false,
                evaluate(a, b) {
                    if (isNaN(a) || isNaN(b))
                        throw "Exception: Trying to do number operations on non number values: " + a + " <= " + b
                    return Number(a) <= Number(b)
                }
            },
            ">=": {
                stack: false,
                evaluate(a, b) {
                    if (isNaN(a) || isNaN(b))
                        throw "Exception: Trying to do number operations on non number values: " + a + " >= " + b
                    return Number(a) >= Number(b)
                }
            },
            "typeof": {
                stack: false,
                evaluate(a, b) {
                    return typeof a == b
                }
            }
        }
    }
    write(type, name, value, place = this.memory) {
        let path = this.followPath(name, place)
        if (!(type in this.dataTypes))
            throw "Exception: Type " + type + " doesn´t exist. path: '" + name + "' value: '" + value + "'"
        let assign = new this.dataTypes[type](name, value, this, { ...this.memory, ...place })
        if (path.isNested) {
            path.place[path.end] = assign
            return
        }
        place[assign.name] = assign
    }
    rewrite(name, value, place = this.memory) {
        let path = this.followPath(name, place)
        if (path.isNested) {
            try {
                path.place[path.end].set(value, { ...this.memory, ...place })
            } catch {
                throw "Variable '" + name + "', you are trying to reassign to '" + value + "' is undefined."
            }
            return
        }
        if (path.end in place)
            try {
                place[path.end].set(value, { ...this.memory, ...place })
                return true
            } catch {
                throw "Variable '" + name + "', you are trying to reassign to '" + value + "' is undefined."
            }
        try {
            this.memory[path.end].set(value, { ...this.memory, ...place })
        } catch {
            throw "Variable '" + name + "', you are trying to reassign to '" + value + "' is undefined."
        }
        return true
    }
    readToken(parent, expression) {
        for (let i in this.tokens[parent])
            if (expression.indexOf(i) == 0) return i
        throw "Unknown token '" + expression + "' in modificator '" + parent + "'"
    }
    removeToken(token, expression) {
        return expression.substring(token.length)
    }
    removeParams(expression, brackets = "({[") {
        for (let i in expression)
            if (brackets.indexOf(expression[i]) != -1)
                return expression.substring(0, i)
        return expression
    }
    translateParams(expression, memory, left = "({[", right = ")}]") {
        let expr = this.split(expression).pop()
        let str = ""
        let result = []
        let count = 0
        for (let i = 1; i < expr.length - 1; i++) {
            if (left.indexOf(expr[i]) != -1) {
                count++
            } else if (right.indexOf(expr[i]) != -1) {
                count--
            }
            if (expr[i] == ";" && count == 0) {
                result.push(str)
                str = ""
                continue
            }
            str += expr[i]
        }
        if (count != 0) {
            throw "Syntax error: Invalid number of brackets at '" + expr + "'"
        }
        result.push(str)
        for (let i in result) {
            result[i] = this.translateSingle(result[i], memory)
        }
        return result
    }
    splitParams(expression, left = "{[(", right = "}])") {
        let count = 0
        let result = []
        let str
        for (let i in expression) {
            if (count > 0)
                str += expression[i]
            if (left.indexOf(expression[i]) != -1) {
                if (count == 0)
                    str = expression[i]
                count++
            }
            else if (right.indexOf(expression[i]) != -1) {
                count--
                if (count == 0) {
                    if (left.indexOf(str[0]) == right.indexOf(str[str.length - 1]) && (i == expression.length - 1 || left.indexOf(expression[i - -1]) != -1)) {
                        result.push(str)
                    }
                    else throw "Syntax error: Invalid number of brackets at '" + expression + "'"
                }
            }
        }
        if (count == 0)
            return result
        throw "Invalid expression: " + expression
    }
    followPath(path, nested = this.memory) {
        try {
            let place = { ...this.memory, ...nested }
            let split = this.split(path, ".")
            let origin = split.shift()
            if (!(origin in place) || this.indexOfBrackets(path, "{[.") == -1) {
                return { place, origin, end: origin, isNested: false }
            }
            let end = split.pop()
            place = place[origin]
            for (let i in split) {
                let suffix = this.suffix(split[i])
                place = place[suffix.suffix][suffix.translate ? this.translateParams(split[i], { ...this.memory, ...nested })[0] : split[i]]
            }
            let endSuff = this.suffix(end)
            place = place[endSuff.suffix]
            if (endSuff.translate)
                end = this.translateParams(end, { ...this.memory, ...nested })[0]
            if (!(end in place))
                console.warn("Warning: Path '" + path + "' doesn´t end with existing value.")
            return { place, origin, end, isNested: true }
        }
        catch {
            throw "Failed at reading path: '" + path + "'"
        }
    }
    suffix(expression) {
        let idx = -1
        for (let i in expression) {
            let curIdx = "([{".indexOf(expression[i])
            if (curIdx != -1)
                idx = curIdx
            break
        }
        switch (idx) {
            case -1: return { suffix: "containes", translate: false }
            case 1: return { suffix: "array", translate: true }
            case 2: return { suffix: "containes", translate: true }
        }
    }
    translateSingle(expression, nested = {}) {
        if (typeof expression != "string") return expression
        if (expression[0] == this.indicators.immutable) return expression.substring(1)
        let memory = { ...this.memory, ...nested }
        let removed = this.removeParams(expression, "(")
        if (removed.length > 1 && removed[0] === this.indicators.comparison)
            return String(this.readComparison(expression.substring(1), memory))
        let path = this.followPath(removed, nested)
        if (path.end in path.place)
            return path.place[path.end].read(this.translateParams(expression, nested), memory, path)
        return expression
    }
    translateMultiple(expression, nested = {}) {
        if (typeof expression != "string") return expression
        let split = expression.split(this.indicators.split)
        for (let i in split)
            split[i] = this.translateSingle(split[i], nested)
        return split.join("")
    }
    requestAction(parent, token, expression, value, memory) {
        return this.tokens[parent][token](expression, value, memory)
    }
    readCode(parent, expression, memory = this.memory) {
        let line = 0
        let ans
        for (let i in expression) {
            try {
                ans = this.readLine(parent, i, expression[i], memory)
            } catch (e) {
                console.error("code: ", expression, "\nmemory: ", memory)
                throw "Error on line " + line + "\n" + e
            }
            line++
            if (ans !== undefined)
                return ans
        }
        return ""
    }
    readLine(parent, left, right, memory = this.memory) {
        while (left[0] === this.indicators.duplicate) left = left.substring(1)
        let token = this.readToken(parent, left)
        let actions = this.requestAction(parent, token, this.removeToken(token, left), right, memory)
        for (let j in actions) {
            let ans = this.actions[j](actions[j], memory)
            if (ans !== undefined && ans !== "")
                return ans
        }
    }
    split(expression, splitter = ".", brackets = ["[]", "()", "{}"]) {
        let product = []
        let count = 0
        let str = ""
        for (let i = 0; i < expression.length; i++) {
            for (let j = 0; j < brackets.length; j++) {
                if (expression[i] === brackets[j][0])
                    count++
                else if (expression[i] === brackets[j][1])
                    count--
            }
            if (expression[i] === splitter && count == 0) {
                product.push(this.removeParams(str))
                product = [...product, ...this.splitParams(str)]
                str = ""
                continue
            }
            str += expression[i]
        }
        product.push(this.removeParams(str))
        product = [...product, ...this.splitParams(str)]
        return product
    }
    readComparison(expression, memory = {}) {
        let backstack = [null, null]
        let frontstack = [null, null]
        let commands = expression.split(" ")
        for (let i = 0; i < commands.length; i++) {
            let command = this.translateSingle(commands[i], memory)
            if (command in this.comparison) {
                if (this.comparison[command].stack) {
                    frontstack[1] = command
                    continue
                }
                if (backstack[1] !== null) {
                    if (!(backstack[1] in this.comparison))
                        throw "Expected operator, found '" + backstack[1] + "' at expression '" + expression + "'"
                    frontstack[0] = this.comparison[backstack[1]].evaluate(backstack[0], frontstack[0])
                    backstack[0] = null
                    backstack[1] = command
                    continue
                }
                backstack[1] = command
                backstack[0] = frontstack[0]
                frontstack[1] = null
                frontstack[0] = null
                continue
            }
            if (frontstack[0] === null) {
                frontstack[0] = command
                continue
            }
            if (frontstack[1] !== null) {
                if (!(frontstack[1] in this.comparison))
                    throw "Expected operator, found '" + frontstack[1] + "' at expression '" + expression + "'"
                frontstack[0] = this.comparison[frontstack[1]].evaluate(frontstack[0], command)
                frontstack[1] = null
                continue
            }
            if (!(backstack[1] in this.comparison))
                throw "Expected operator, found '" + backstack[1] + "' at expression '" + expression + "'"
            frontstack[0] = this.comparison[backstack[1]].evaluate(frontstack[0], command)
            backstack[1] = null
            backstack[0] = null
            frontstack[1] = null
        }
        if (backstack[1] === null)
            return frontstack[0] ?? backstack[0]
        if (!(backstack[1] in this.comparison))
            throw "Expected operator, found '" + backstack[1] + "' at expression '" + expression + "'"
        return this.comparison[backstack[1]].evaluate(backstack[0], frontstack[0])
    }
    indexOfBrackets(expression, brackets = "([{") {
        let idx
        for (let i in expression) {
            idx = brackets.indexOf(expression[i])
            if (idx != -1)
                return idx
        }
        return -1
    }
}

