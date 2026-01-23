"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Drawer = Drawer;
const react_1 = require("@interchain-ui/react");
function Drawer({ children, show = false, onClose = () => { }, }) {
    return (<react_1.Box top="0" left="0" right="0" bottom="0" zIndex={show ? 100 : -100} width="100%" height="100%" display="flex" position="fixed" opacity={show ? 1 : 0} transition="all .3s ease">
      <react_1.Box transition="all .3s ease" backgroundColor={show ? "$blackAlpha500" : "transparent"} attributes={{
            onClick: onClose,
            style: {
                flex: 1,
                backdropFilter: show ? "blur(2px)" : "none",
            },
        }}/>
      <react_1.Box width={show ? "80%" : "0"} transition="all .3s ease" backgroundColor="white">
        {children}
      </react_1.Box>
    </react_1.Box>);
}
