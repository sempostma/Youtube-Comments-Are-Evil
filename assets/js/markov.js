"use strict";

var _createClass = (function () {
    function defineProperties(target, props) {
        for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];
            descriptor.enumerable = descriptor.enumerable || false;
            descriptor.configurable = true;
            if ("value" in descriptor) descriptor.writable = true;
            Object.defineProperty(target, descriptor.key, descriptor);
        }
    }
    return function (Constructor, protoProps, staticProps) {
        if (protoProps) defineProperties(Constructor.prototype, protoProps);
        if (staticProps) defineProperties(Constructor, staticProps);
        return Constructor;
    };
})();

function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
    }
}

// Markov Model from https://www.soliantconsulting.com/blog/2013/02/title-generator-using-markov-chains

function markovWordChoice(a) {
    var i = Math.floor(a.length * Math.random());
    return a[i];
}

var MarkovTextGenerator = (function () {
    function MarkovTextGenerator() {
        _classCallCheck(this, MarkovTextGenerator);

        this.markovTerminals = {};
        this.markovStartWords = [];
        this.markovWordStats = {};
    }

    _createClass(MarkovTextGenerator, [
        {
            key: "reset",
            value: function reset() {
                this.markovTerminals = {};
                this.markovStartWords = [];
                this.markovWordStats = {};
            }
        },
        {
            key: "markovTrain",
            value: function markovTrain(words) {
                this.markovTerminals[words[words.length - 1]] = true;
                this.markovStartWords.push(words[0]);
                for (var j = 0; j < words.length - 1; j++) {
                    if (this.markovWordStats.hasOwnProperty(words[j])) {
                        this.markovWordStats[words[j]].push(words[j + 1]);
                    } else {
                        this.markovWordStats[words[j]] = [words[j + 1]];
                    }
                }
            }
        },
        {
            key: "markovMakeSentence",
            value: function markovMakeSentence(min_length) {
                // Init
                var word = markovWordChoice(this.markovStartWords);
                var sentence = [word];
                // Loop
                while (this.markovWordStats.hasOwnProperty(word)) {
                    var next_words = this.markovWordStats[word];
                    word = markovWordChoice(next_words);
                    sentence.push(word);
                    if (
                        sentence.length > min_length &&
                        this.markovTerminals.hasOwnProperty(word)
                    ) {
                        break;
                    }
                }
                // Recursive call
                if (sentence.length < min_length && Math.random() > 0.2) {
                    return this.markovMakeSentence(min_length);
                }
                return sentence
                    .map(function (x) {
                        if (x === ".") return ". ";
                        else if (x === ",") return ", ";
                        return " " + x;
                    })
                    .join("")
                    .trimLeft();
            }
        }
    ]);

    return MarkovTextGenerator;
})();

function createWords(txt) {
    return txt
        .replace(/([.,])/g, " $1")
        .toLowerCase()
        .split(" ")
        .map(function (w) {
            return w.replace(/"?(.+?)"?/g, "$1");
        })
        .map(function (w) {
            return w.trim();
        })
        .filter(function (str) {
            return str;
        });
}
