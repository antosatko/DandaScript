class DNDSInterpret {
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
                    this.name = name.substring(0, name.indexOf("["))
                    this.params = this.interpret.split(name.substring(name.indexOf("[") + 1, name.length - 1), ";")
                    if (this.params[1] !== "")
                        for (let i in this.params)
                            this.params[i] = this.interpret.split(this.params[i], ":")
                    //else this.params = [] prozatim to necham odstranene, pokud nebudou chyby
                    if (JSON.stringify(this.params) == '[[""]]')
                        this.params = []
                    this.value = value
                }
                read(params, nested = {}) {
                    let memory = {}
                    if(params != undefined)
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
                    this.set(value)
                }
                read(params, nested = {}) {
                    return "(object)"
                }
                set(params, memory = {}) {
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
                    this.len = 0
                    this.set(value, memory)
                }
                read(params, nested = {}) {
                    let aq
                    return this.array[params]
                }
                set(params, memory = {}) {
                    for (let i in params) {
                        this.interpret.write(i, String(this.len), this.interpret.translateSingle(params[i], memory), this.array)
                        this.len++
                    }
                    return
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
        this.actions = {// mozna vyuziju pozdeji, nechci kvuli bezpecnosti // koho zajima bezpecnost lmao
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
                this.interpret.translateMultiple(data, memory)
            },
            delete(data, memory = {}) {
                let path = this.interpret.followPath(data, memory)
                delete path.place.containes[path.end]
            },
            interpret: this
        }
        this.comparison = {
            "+": {
                stack: true,
                evaluate(a, b) {
                    return ((!isNaN(a) ? Number(a) : a) + (!isNaN(b) ? Number(b) : b))
                }
            },
            "-": {
                stack: true,
                evaluate(a, b) {
                    return ((!isNaN(a) ? Number(a) : a) - (!isNaN(b) ? Number(b) : b))
                }
            },
            "*": {
                stack: true,
                evaluate(a, b) {
                    return ((!isNaN(a) ? Number(a) : a) * (!isNaN(b) ? Number(b) : b))
                }
            },
            "/": {
                stack: true,
                evaluate(a, b) {
                    return ((!isNaN(a) ? Number(a) : a) / (!isNaN(b) ? Number(b) : b))
                }
            },
            "%": {
                stack: true,
                evaluate(a, b) {
                    return ((!isNaN(a) ? Number(a) : a) % (!isNaN(b) ? Number(b) : b))
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
                    return ((!isNaN(a) ? Number(a) : a) < (!isNaN(b) ? Number(b) : b))
                }
            },
            ">": {
                stack: false,
                evaluate(a, b) {
                    return ((!isNaN(a) ? Number(a) : a) > (!isNaN(b) ? Number(b) : b))
                }
            },
            "<=": {
                stack: false,
                evaluate(a, b) {
                    return ((!isNaN(a) ? Number(a) : a) <= (!isNaN(b) ? Number(b) : b))
                }
            },
            ">=": {
                stack: false,
                evaluate(a, b) {
                    return ((!isNaN(a) ? Number(a) : a) >= (!isNaN(b) ? Number(b) : b))
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
        let assign = new this.dataTypes[type](name, value, this, { ...this.memory, ...place })
        if (path.isNested) {
            path.place[path.end] = assign
            return true
        }
        place[assign.name] = assign
        return true
    }
    rewrite(name, value, place = this.memory) {
        let path = this.followPath(name, place)
        if (path.isNested) {
            path.place[path.end].set(value, { ...this.memory, ...place })
            return
        }
        if (path.end in place) 
            place[path.end].set(value, { ...this.memory, ...place })
        else 
            this.memory[path.end].set(value, { ...this.memory, ...place })
        return true
    }
    readToken(parent, expression) {
        for (let i in this.tokens[parent])
            if (expression.indexOf(i) == 0) return i
        return null
    }
    removeToken(token, expression) {
        return expression.substring(token.length)
    }
    removeParams(expression, brackets = "[") { //expression.neco je undefined protoze to neni string ffs uz si to zapamatuj
        return expression.substring(0, expression.indexOf(brackets)) || expression
    }
    translateParams(expression, memory, brackets = "[]") {
        let str = ""
        let count = 0
        for(let i in expression){
            if(count > 0){
                if(expression[i] == brackets[1]){
                    count--
                    if(count == 0)
                        break
                }
                //if(str[str.length - 1] != ";" || expression[i] != " ") // pro vykon programu nic moc, ale vypada to dobre :D
                str += expression[i]
            }
            if(expression[i] == brackets[0])
                count++
            if(count == 0 && "{[(".indexOf(expression[i]) != -1) break
        }
        if(count != 0) return [""]
        let split = this.split(str, ";")
        for(let i in split)
            split[i] = this.translateSingle(split[i], memory)
        return split
    }
    followPath(path, nested = this.memory) {
        let place = { ...this.memory, ...nested }
        let split = this.split(path, ".")
        let origin = split.shift()
        if (path.indexOf(".") == -1 && !(this.removeParams(origin, "{") in place)) return { place, origin, end: origin, isNested: false }
        /*for (let i in split) 
            split[i] = this.translateSingle(split[i], place)*/
        let end = split.pop() || origin
        let translated = this.translateParams(origin, nested, "{}")
        place = translated[0] != "" ? place[this.removeParams(origin, "{")].array : place[origin].containes
        for (let i in split) 
            place = this.translateParams(split[i], nested, "{}")[0] != "" ? place[this.removeParams(split[i], "{")].array : place[split[i]].containes
        let translatedEnd = this.translateParams(end, nested, "{}")
        if(translatedEnd[0] != "") {
            if(origin != end)
                place = place[this.removeParams(end, "{")].array
            end = translatedEnd
        }
        return { place, origin, end, isNested: true }
    }
    translateSingle(expression, nested = {}) {
        if (typeof expression != "string") return expression
        if (expression[0] == this.indicators.immutable) return expression.substring(1)
        let memory = { ...this.memory, ...nested }
        let removed = this.removeParams(expression)
        if (removed.length > 1 && removed[0] === this.indicators.comparison) {
            return String(this.readComparison(expression.substring(1), memory))
        }
        let path = this.followPath(removed, nested)
        if (path.end in path.place) {
            return path.place[path.end].read(this.translateParams(expression, nested), memory)
        }
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
        for (let i in expression) {
            let ans = this.readLine(parent, i, expression[i], memory)
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
        let seen = 0
        let str = ""
        for (let i = 0; i < expression.length; i++) {
            for (let j = 0; j < brackets.length; j++) {
                if (expression[i] === brackets[j][0])
                    seen++
                else if (expression[i] === brackets[j][1])
                    seen--
            }
            if (expression[i] === splitter && seen == 0) {
                product.push(str)
                str = ""
                continue
            }
            str += expression[i]
        }
        product.push(str)
        return product
    }
    readComparison(expression, memory = {}) {
        let backstack = [null, null]
        let frontstack = [null, null]
        let commands = this.split(expression, " ")
        for (let i = 0; i < commands.length; i++) {
            let command = this.translateSingle(commands[i], memory)
            if (command in this.comparison) {
                if (this.comparison[command].stack) {
                    frontstack[1] = command
                    continue
                }
                if (backstack[1] !== null) {
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
                frontstack[0] = this.comparison[frontstack[1]].evaluate(frontstack[0], command)
                frontstack[1] = null
                continue
            }
            frontstack[0] = this.comparison[backstack[1]].evaluate(frontstack[0], command)
            backstack[1] = null
            backstack[0] = null
            frontstack[1] = null
        }
        if (backstack[1] === null)
            return frontstack[0] ?? backstack[0]
        return this.comparison[backstack[1]].evaluate(backstack[0], frontstack[0])
    }
}







/**
 *  nefunguje return funkce, pravdepodobne spatne vraci hodnotu, nebo ji uz nemuze precist
 * let read v funkci je undefined
 * nenavidim se
 * "jooo tohle rychle zpravím aby to v budoucnu nedělalo problémy"
 * hehehehehehehehehhahahahehaehahhhahahahhaahhahahahahahhahahaha
 * ¨
 * problémy ty to udělalo a nemálo
 * 4 hodiny jsem to zpravoval
 * proc to delam
 * uz to funguje
 * necitim stesti jen prazdnotu
 * 
 */




/*

"/string danda": "fsdragfsd"

let action = modifier("/", "string danda")

requestAction(data  )

*/

/**CHANGE LIST
 * 
 * DATA TYPES{
 *  function
 *  sentence
 *  string
 *  number
 *  COMING{
 *      const // uklada jakoukoliv hodnotu, se kterou lze operovat po prideleni datoveho typu
 *      object
 *      array
 *      boolean // co bych s tim ztracel cas, string bude stacit
 *  }
 * }
 * 
 * den 3. asi 
 * -prvni verze for i 50
 * -prvni verze if /variable
 * -uprava uhlednosti a recyklace kodu
 * -benchmark for i 50000{
 *      js: 2
 *      dnds: 212
 *      dnds se casem zlepsoval prumerne porovnani js je 70x rychlejsi
 *      dnds po optimalizaci by se melo vyrazne zrychlit odhaduji 10-5x pomalejsi
 *      dnds pro vytvoreni jednoduche hry dostacujici
 * }
 * 
 * 
 * den 4. 
 *  -moznost prepsat promennou
 *  -for i 50000 - dnds: 60 - 20
 *  -plany: navratova hodnota, intuitivni prepsani promenne, zavorky ve vyrazu
 * 
 * den 5.
 *  -minor changes
 *      -const // uklada jakoukoliv hodnotu, se kterou lze operovat po prideleni datoveho typu
 *      -write performance boost
 * 
 * den 6.
 *  -bugfix - for nemusí používat proměnnou i // jop fakt jsem to udělal tak špatně, že šla použít jenom proměnná i
 *  -akce, ktere muze kod vyvolat se nini pisou do objektu pro modularnost
 *  -super-ultra-maly performance boost pri vytvareni promennych
 * 
 * den 7.
 *  -funkce nyni funguje i s 0 argumenty (ano predtim to neslo :D)
 *  -argumenty funkce nini odeleny strednikem misto carky
 *  -uprava uhlednosti kodu
 *  -BIG moznost vypsat promennou uvnitr stringu
 *      -funkcim lze prepsat pouze kod, argumenty nikoliv
 *      -pro pretypovani staci deklarovat novou promennou se stejnym nazvem a jinym typem
 * 
 * den 8.
 *  -priprava pro modulaci
 *  -uprava kodu (zjednodusene hledani tokenu - uvolneni trochu pameti a hlavne lepsi modulace)
 *  this.tokens = {
 *         code: ["for ", "if ", "switch ", "control", "/", "return", "console"],
 *         head: ["include", "init", "setup"],
 *         execute: ["for", "if", "interval", "function"]
 *  } // abych si to pamatoval
 *  - planuju dat vsechny datove typy do nejakeho modulu, napr std nebo tak
 *  - VSEMOCNE INDIKATORY!!!
 *  - nevim jak jsem rozbil for, ale uz jsem to patchnul
 *  -for i 50000 - dnds: 50
 * 
 * den 9.
 *  - sentence ma nini pristup do docasne pameti napr. uvnitr funkce // zabralo mi to asi 1 minutu a myslim, ze to pro dnesek staci :)
 * 
 * den 11.
 *  - implementace porovnavani
 *      -cte se z leva do prava
 *      "console":"=50 + 60 / 10" // log: 11
 * 
 * den 12.
 *  - bugfix - promenne vytvorene ve funkci ted vidi do pameti funkce
 *  - for ted muze pouzivat logiku v leve strane // for i =50 * 2
 * 
 * den 13.
 *  - ptr datovy typ, brzy ale asi smazu a udelam pomoci referencnich tokenu, nebo jak se tomu rika, proste (*, &)
 * 
 * den 14.
 *  bubfix - return v for a if funguje
 * 
 * den 15.
 *  bugfix - funkce uvnitr vypoctu se ted vola spravne // =pow[2;2] + 20 // drive by hodilo error
 * 
 * den 16.
 *  keyword: read - precte hodnotu promenne, vyuzivany hlavne pro funkce, pokud nas nezajima navratova hodnota
 *  knihovny:
 *      DNDSConnect: funguje jako bridge mezi js a dnds
 *      DNDSCanvas: umoznuje kreslit na html canvas
 *      DNDS_HTML_Input: umoznuje vyuzivat eventy pro kliknuti mysi, ci klavesnice v prohlizeci
 *  bugfix - hodnoty na stacku se nini spravne posilaji do volane funkce
 * 
 * den 17.
 *  objekty jsou tu!
 *  zapis objektu:
 *      "/object myObject":{
 *          "string hello":"world",
 *          "object anotherObject":{
 *              "function myFun[string:name]":{
 *                  "console":"Hello _name_!"
 *              }
 *          }
 *      }
 *  zapis do objektu:
 *      "/string myObject.myNewString":"Hello world!"
 *  prepsani uvnitr objektu:
 *      "/myObject.myNewString":"Goodbye world!"
 *  for loop
 *      "for i 5":{
 *          "/number myObject.i":"i", // vytvori 5 promennych se jmeny 0, 1, 2, 3, 4 a stejnymi hodnotami
 * 
 *          "/number myObject.!i":"i" // 5x vytvori promennou i s hodnotami 0, 1, 2, 3, 4 - tedy konecny produkt je promenna i s hodnotou 4
 *      }
 *  minor changes:
 *      vykricnik pred nazvem znamena, ze nechceme cist z pameti - "console":"!time_ is not _time" // log: 'time is not 99'
 *      cisla a boolean se nini nemusi psat jako string - "/number cislo":50 ; "/cislo": "20" ; "/string myBool": true
 *  keyword: delete - smaze prvek objektu "delete":"myObject.myNewString"
 *  poznámka:
 *      stale netusim, proc bych mel do dandascriptu pridavat boolean jako datovy typ
 * 
 * den 18.
 *  konecne jdou opravdu vytvorit funkce s nulou argumentu
 *  pridana stdLib - hlavni je to, ze muzu pridavat funkce v js pohodlnym zpusobem
 *  zase neusnu, nechapu, proc vzdy vecer programuju 10x lepe a uz me to zacina stvat, ale asi se tak muzu pres den soustredit na realny zivot
 *  kazdopadne, abych si to tady nerikal jen tak do prazdna:
 *  DNDSInterpret.split() je nova funkce umoznujici mi efektivne parsovat text, drive jsem pouzival Array.prototype.split(),
 *  nebo jak se ta cesta pise a ten mi nezajistil dostatecnou flexibilitu
 *  taky jsem si zacal ukladat verze pro pripad ze neco nenavratne rozbiju, nebo jinak ztratim data
 *      -dalo by se rict, ze to delam, abych mel hmatatelny dukaz o mem pokroku, ale do tech verzi se stejne nikdy nepodivam, takze co uz :D + poznamky mi staci
 *  POZN: ONO TO FUNGUJE NA PRVNI POKUS!!!!
 *      -test:
 *  "/function sayHello[string:hello]":{
        return:"hello"
    },
    "return":"sayHello[std.pow[2;2]]" // vratilo: 4 // drivejsi verze vrati: 'std.pow[2'
 *  
 */


/** // bugy co jsem nevyresil prvni den, po objevu
 * 
 * bugs: return v if a for nefunguje správně 12. den // fixed 14. den
 *      pokud posilam do funkce immutable promennou sayHello[!!!hello] - je nutne napsat 3 vykricniky 17. den
 * 
 */




/**
 * KOCEPT STACK COMPARISONS - den 10.
 * 
 * výraz: "one + seven = 19 - nine + negativeTwo = eight"
 * 
 * backstack = null /-/ = > < <= >= /-/
 * frontstack = null /-/ + - * / % **
 * 
 * start
 * frontstack 1
 * frontstack2  +
 * frontstack 7, ""
 * backstack = frontstack(8), =; frontstack = null
 * frontstack 19
 * frontstack2 -
 * frontstack 9, ""
 * frontstack2 +
 * frontstack -2
 * backstack = true(backstack = frontstack), =; frontstack = null
 * frontstack = 8
 * end; backstack = false(backstack(true) = 8); frontstack = null
 * return frontstack ?? backstack
 * 
 * 
 */

/**
 * DEN 12. PRVNI UZITECNA FUNKCE V DnD scriptu - pow // pro tyhle veci budu stejne delat js knihovny, ale je fajn videt, ze uz neco funguje
 * "/function pow[number:num;number:n]":{
        "/number start":"num",
        "for i =n - 1":{
            "/num":"=start * num"
        },
        "return":"num"
    }
    mozna bych mel udelat i debug release, tohle mi zbitecne zabralo az prilis hodin

    DEN 13. - nic navic, jenom tahle funkce pro odmocnovani

    "/function sqrt[number:num]":{
        "/number guess":"=num / 2",
        "for i 10":{
            "/guess":"=num / guess + guess * 0.5"
        },
        "return":"guess"
    },
    "return":"sqrt[225]"


    // verze s exponentem // if na zacatku neni uplne dulezity, je tam jen pro bezpecnost, ale optimalni by to bylo bez nej
    "/function sqrt[number:num;number:exponent]":{
        "if =exponent < 2":{
            "/exponent": "2"
        },
        "for j =exponent - 1":{
            "/number guess":"=num / 2",
            "for i 10":{
                "/guess":"=num / guess + guess * 0.5"
            },
            "/num":"guess"
        },
        
        "return":"guess"
    },
    "return":"sqrt[81;5]"

 * 
 */