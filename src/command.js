"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Command;
(function (Command) {
    Command[Command["SetClientName"] = 50] = "SetClientName";
    Command[Command["RequestControllerCount"] = 0] = "RequestControllerCount";
    Command[Command["RequestControllerData"] = 1] = "RequestControllerData";
    Command[Command["UpdateLeds"] = 1050] = "UpdateLeds";
    Command[Command["UpdateZoneLeds"] = 1051] = "UpdateZoneLeds";
    Command[Command["SetCustomMode"] = 1100] = "SetCustomMode";
    Command[Command["UpdateMode"] = 1101] = "UpdateMode"
})(Command || (Command = {}));
exports.default = Command;
