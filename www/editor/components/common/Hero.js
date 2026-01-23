"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Hero = Hero;
// @ts-nocheck
const link_1 = __importDefault(require("next/link"));
const react_1 = require("@interchain-ui/react");
const Connect_1 = __importDefault(require("./Connect"));
function Hero() {
    return (<react_1.Box display="flex" my="$14">
      <react_1.Box mt="$14" maxWidth="500px">
        <react_1.Text color="$purple400" fontSize="$lg" fontWeight="$medium" attributes={{ display: "block" }}>
          Build and grow projects in light speed
        </react_1.Text>
        <react_1.Text fontSize="64px" fontWeight="$medium" attributes={{
            mt: "$10",
            mb: "$10",
            display: "block",
        }}>
          Build web3 apps in light speed
        </react_1.Text>
        <react_1.Text color="$gray500" fontSize="$sm" lineHeight="$tall" attributes={{
            display: "block",
            marginTop: "$7",
        }}>
          Cosmology develops cutting-edge tools for the interchain ecosystem,
          empowering seamless interactions across the Internet of Blockchains.
        </react_1.Text>
        <link_1.default href="/components" style={{ display: "inline-block" }}>
          <react_1.Button intent="tertiary" attributes={{ mt: "$10" }}>
            View Components
          </react_1.Button>
        </link_1.default>
      </react_1.Box>
      <react_1.Box display={{ mobile: "none", desktop: "block" }}>
        <Connect_1.default />
      </react_1.Box>
    </react_1.Box>);
}
