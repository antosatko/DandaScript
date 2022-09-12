let dandaScript = {
    //first script to load
    head: {
        include: [
            // keywords and correct syntax:
            // only - include only selected items -> "stdLib.js only events,math"
            // !only - include all items except selected -> "stdLib.js !only events,math"
            "stdLib", // keywords: if, for, function, object,      execute
            "console", // "console log": "Hello world!"
            "math", // enables using math in string; "//friends": "math //schoolfriends + /onlinefriends + 2"
            "inputHTML", // input keys etc
            "eval", // executes string as javascript; do not use
            "connect" // allows to share functions and events with javascript
        ],
        // fired only once to create variables
        init: {
            "addToScore": 25,
            "keys": {},
            "mouse":{},

            "object myObj": {
                "score": 50,

                "private function addScore []": {
                    "if math /addToScore < 50": {
                        "//score": "math += /addToScore",
                        "else": {
                            "//score": "math += 50",
                        }
                    }
                },

                "function activate []": {
                    "//addScore": [],
                    "console log": "your score: //score",
                    "console log?": "Hello world!",
                    return: "//score"
                }
            },

            "function sum [a b]": {
                return: "math /a + /b"
            },

            "class enemy":{
                "constructor [x y]": {
                    /////////////////////////////////////
                    "list number x y w h": "x y 50 40",
                    /*
                    "//x": "/x",
                    "//y": "/y",
                    "//w": 50,
                    "//h": 40
                    */
                },
                "move []":{
                    // like switch but takes array / object and tries for true in all elements
                    "control keys":{
                        "W":{
                            "//y": "+= 5"
                        },
                        "S":{
                            "//y": "-= 5"
                        },
                        "D":{
                            "//x": "+= 5"
                        },
                        "A":{
                            "//x": "-= 5"
                        }
                    }
                }
            }
        },
        setup: {
            "for i in /": {
                "console log": "/i" // log: addToScore myObj sum
            },
            "for i in /myObj": {
                "console log": "/i", // log: score addScore activate
                "console log?": "/myObj[/i]" // 50 'function' 'function'
            },
            "for i 50": {
                "console log": "/i", // log: 0 1 2 3 4 ... 30 41 42 43 ... 49
                "if math /i == 30": {
                    "/i": "+ 10"
                }
            },
            "for i 50 !": {
                "console log": "/i", // log: 0 1 2 3 4 ... 30 41 42 43 ... 59
                "if math /i == 30": {
                    "/i": "+= 10"
                }
            }
        }
    },
    // entry point after completing head
    // terminates program after completion; to create a loop for each frame, return 1
    main: {
        execute: {
            "for": 50,
            "interval": 10,
            "function": {
                "/addToScore": "+= 1",
                "if math /addToScore == 30": {
                    sleep: 60
                }
            },
            "/myObj.activate": []
        },
        return: 1
    },
    inputHTML: {
        "key W A S D [name, press]": {
            "if /press": {
                "console log": "you pressed /name",
                "else": {
                    "console log": "you released /name"
                }
            },
            "/keys[/name]": "/press"
        },
        "translate mouse": "/mouse"
    }
}