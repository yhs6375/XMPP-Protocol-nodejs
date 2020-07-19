const HSModulePATH = process.cwd() + "/src",
    EventEmitter = require("events").EventEmitter,
    Element = require(HSModulePATH + "/hschat/packet/Element"),
    HSChatParseError = require(HSModulePATH + "/hschat/errorPack").HSChatParseError;

/*HSChat프로토콜 기준으로 만들어진 Recorder
  실시간, 동기*/
class HSChatReader {
    constructor() {
        this.readMessage = "";
        this.tagInfo = {};
        this.depth = 0;
        this.rootDepth = 1;
        this.tempStr = "";
        this.tempWrap = false;
        this.state = {
            mainState: HSChatReader.STATE_START_TAG_NAME,
            attrState: HSChatReader.STATE_ATTR_NAME,
            selfEndTag: false,
            first: true,
            startHeadFirstChar: false,
            continue: true,
            afterEndCheck: false,
        };
        this.outState = {
            report: false,
            checkState: HSChatReader.STATE_START_TAG_NAME,
        };
        this.pos = 0;
        this.readCount = 0;
    }
    //read할 데이터 추가
    addData(msg) {
        this.readMessage += msg;
    }
    changeRootDepth(depth) {
        this.rootDepth = depth;
    }
    reportStateCheck(checkState) {
        let state = this.state;
        if (this.rootDepth === this.depth) {
            if (checkState === HSChatReader.CHECK_END) {
                state.afterEndCheck = true;
            }
            this.outState.checkState = checkState;
            state.continue = false;
            this.outState.report = true;
        } else if (checkState === HSChatReader.CHECK_END) {
            this.depth--;
        }
    }

    read() {
        let state = this.state;
        if (state.afterEndCheck) {
            let i = this.depth;
            while (this.tagInfo[i++]) {
                this.tagInfo[i] = null;
            }
            this.depth--;
            state.afterEndCheck = false;
        }
        state.continue = true;
        while (state.continue) {
            switch (state.mainState) {
                case HSChatReader.STATE_START_TAG_NAME:
                    console.log("readStartTag");
                    this.readStartTagHeadName();
                    break;
                case HSChatReader.STATE_ATTR:
                    console.log("readAttr");
                    this.readAttr();
                    break;
                case HSChatReader.STATE_TEXT:
                    console.log("readText");
                    this.readText();
                    break;
                case HSChatReader.STATE_END_TAG:
                    console.log("readEndTag");
                    this.readEndTag();
                    break;
            }
        }
        if (this.outState.report) {
            let el = this.tagInfo[this.depth];
            this.outState.report = false;
            return el;
        }
    }
    readStartTagHeadName() {
        let state = this.state,
            c;
        this.zoneStart();
        for (; this.pos < this.readMessage.length; this.pos++) {
            c = this.readMessage.charCodeAt(this.pos);
            console.log(this.readMessage[this.pos]);
            if (
                (state.startHeadFirstChar === true && c >= 97 && c <= 122) ||
                (c >= 65 && c <= 90) ||
                (c >= 48 && c <= 57)
            ) {
                this.tagInfo[this.depth].name += this.readMessage[this.pos];
            } else if ((state.startHeadFirstChar === false && c >= 97 && c <= 122) || (c >= 65 && c <= 90)) {
                state.startHeadFirstChar = true;
                this.tagInfo[++this.depth] = {};
                this.tagInfo[this.depth].attrs = {};
                this.tagInfo[this.depth].childs = {};
                this.tagInfo[this.depth].childCount = 0;
                this.tagInfo[this.depth].contents = "";
                this.tagInfo[this.depth].name = "";
                this.tagInfo[this.depth].name += this.readMessage[this.pos];
            } else if (c === 47 /* / */) {
                if (state.readStartHeadFirstChar) {
                    //<abc/>
                    state.selfEndTag = true;
                    this.reportStateCheck(HSChatReader.CHECK_START);
                    break;
                }
                this.zoneEnd();
                state.mainState = HSChatReader.STATE_END_TAG;
                break;
            } else if (c === 62 /* > */) {
                this.zoneEnd();
                state.mainState = HSChatReader.STATE_TEXT;
                this.reportStateCheck(HSChatReader.CHECK_START);
                break;
            } else if (c === 32 /* SPACE */) {
                this.zoneEnd();
                state.mainState = HSChatReader.STATE_ATTR;
                break;
            } else {
                throw new HSChatParseError("Head Start char is inappropriate.");
            }
        }
    }
    readAttr() {
        let state = this.state,
            c;
        this.zoneStart();
        for (; this.pos < this.readMessage.length; this.pos++) {
            c = this.readMessage.charCodeAt(this.pos);
            if (state.attrState === HSChatReader.STATE_ATTR_NAME) {
                if ((c >= 97 && c <= 122) || (c >= 65 && c <= 90) || (c >= 48 && c <= 57)) {
                    this.tempStr += this.readMessage[this.pos];
                    if (++this.readCount > 12) {
                        throw new HSChatParseError("The string value is too long for attribute name");
                    }
                } else if (c === 61) {
                    this.readCount = 0;
                    state.attrState = HSChatReader.STATE_ATTR_QUOT;
                } else if (c === 32) {
                    if (this.tempStr !== "") {
                        this.tagInfo[this.depth].attrs[this.tempStr] = null;
                        this.readCount = 0;
                        this.tempStr = "";
                    }
                } else if (c === 62) {
                    if (this.tempStr !== "") {
                        this.tagInfo[this.depth].attrs[this.tempStr] = null;
                        this.tempStr = "";
                    }
                    this.zoneEnd();
                    state.mainState = HSChatReader.STATE_TEXT;
                    this.reportStateCheck(HSChatReader.CHECK_START);
                    break;
                } else if (c === 47) {
                    state.selfEndTag = true;
                    this.zoneEnd();
                    state.mainState = HSChatReader.STATE_END_TAG;
                } else {
                    throw new HSChatParseError("Illegal string");
                }
            } else if (state.attrState === HSChatReader.STATE_ATTR_VALUE) {
                if (c === this.tempQuot) {
                    this.tempStr = "";
                    this.readCount = 0;
                    state.attrState = HSChatReader.STATE_ATTR_NAME;
                } else {
                    this.tagInfo[this.depth].attrs[this.tempStr] += this.readMessage[this.pos];
                    if (++this.readCount > 50) {
                        throw new HSChatParseError(
                            "The string value is too long for attribute value : " + this.tempStr
                        );
                    }
                }
            } else if (state.attrState === HSChatReader.STATE_ATTR_QUOT) {
                if (c !== 34 && c !== 39) {
                    throw new HSChatParseError("Illegal string");
                }
                this.tempQuot = c;
                this.tagInfo[this.depth].attrs[this.tempStr] = "";
                state.attrState = HSChatReader.STATE_ATTR_VALUE;
            }
        }
    }
    readText() {
        let state = this.state,
            c;
        this.zoneStart();
        if (state.mainState !== HSChatReader.STATE_TEXT) {
            throw new HSChatParseError("State Error: TEXT");
        }
        for (; this.pos < this.readMessage.length; this.pos++, this.readCount++) {
            c = this.readMessage[this.pos];
            if (!this.tempWrap && c === "\\") {
                this.tempWrap = true;
            } else if (this.tempWrap) {
                this.tempWrap = false;
                this.tagInfo[this.depth].contents += c;
            } else {
                if (c !== "<") {
                    this.tagInfo[this.depth].contents += c;
                } else {
                    this.pos--;
                    this.zoneEnd();
                    state.mainState = HSChatReader.STATE_START_TAG_NAME;
                    break;
                }
            }
        }
    }
    readData() {}
    readEndTag() {
        let state = this.state;
        this.zoneStart();
        for (; this.pos < this.readMessage.length; this.pos++) {
            let c = this.readMessage[this.pos];
            if (c === ">") {
                if (!state.selfEndTag && this.tempStr != this.tagInfo[this.depth].name) {
                    throw new HSChatParseError("End tag name don't match start tag name");
                }
                this.zoneEnd();
                state.mainState = HSChatReader.STATE_START_TAG_NAME;
                this.reportStateCheck(HSChatReader.CHECK_END);
                break;
            }
            this.tempStr += c;
            if (++this.readCount > 8) {
                throw new HSChatParseError("The string is too long for end tag name");
            }
        }
    }
    zoneStart() {
        let state = this.state;
        state.continue = false;
        if (state.first && this.readMessage.length !== 0) {
            state.first = false;
            this.readCount = 0;
            switch (state.mainState) {
                case HSChatReader.STATE_START_TAG_NAME:
                    if (this.readMessage[this.pos++] !== "<") {
                        throw new HSChatParseError("Start Tag Head char is not '<'.");
                    }
                    break;
                case HSChatReader.STATE_ATTR:
                    break;
                case HSChatReader.STATE_TEXT:
                    break;
                case HSChatReader.STATE_END_TAG:
                    break;
            }
        }
    }
    zoneEnd() {
        let state = this.state;
        state.continue = true;
        this.state.first = true;
        this.tempStr = "";
        this.readMessage = this.readMessage.slice(++this.pos);
        this.pos = 0;
        this.readCount = 0;
        switch (state.mainState) {
            case HSChatReader.STATE_START_TAG_NAME:
                state.startHeadFirstChar = false;
                break;
            case HSChatReader.STATE_ATTR:
                break;
            case HSChatReader.STATE_TEXT:
                break;
            case HSChatReader.STATE_END_TAG:
                if (this.depth > this.rootDepth) {
                    let parent = this.tagInfo[this.depth - 1],
                        child = this.tagInfo[this.depth];
                    parent.childs[parent.childCount++] = child;
                }
                state.selfEndTag = false;

                break;
        }
    }
}
function makeStaticConst(name, value) {
    Object.defineProperty(HSChatReader, name, {
        value: value,
        writable: false,
        enumerable: true,
        configurable: false,
    });
}
makeStaticConst("STATE_START_TAG_NAME", 0);
makeStaticConst("STATE_ATTR", 1);
makeStaticConst("STATE_TEXT", 2);
makeStaticConst("STATE_END_TAG", 3);

makeStaticConst("STATE_ATTR_NAME", 0);
makeStaticConst("STATE_ATTR_VALUE", 1);
makeStaticConst("STATE_ATTR_QUOT", 2);

makeStaticConst("CHECK_START", 0);
makeStaticConst("CHECK_END", 1);
module.exports = HSChatReader;
