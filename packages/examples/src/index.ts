import { agentReviewLoop } from './graphs/agent-review-loop';
import { agenticEmbed } from './graphs/agentic-embed';
import { agenticKit } from './graphs/agentic-kit';
import { codingAgent } from './graphs/coding-agent';
import { codingSession } from './graphs/coding-session';
import { emailSend } from './graphs/email-send';
import { failedCheckFanout } from './graphs/failed-check-fanout';
import { helloString } from './graphs/hello-string';
import { mathPipeline } from './graphs/math-pipeline';
import type { ExampleFlow } from './types';

export { agentReviewLoop } from './graphs/agent-review-loop';
export { agenticEmbed } from './graphs/agentic-embed';
export { agenticKit } from './graphs/agentic-kit';
export { codingAgent } from './graphs/coding-agent';
export { codingSession } from './graphs/coding-session';
export { emailSend } from './graphs/email-send';
export { failedCheckFanout } from './graphs/failed-check-fanout';
export { helloString, helloStringExpectedOutput } from './graphs/hello-string';
export { mathPipeline, mathPipelineExpectedOutput } from './graphs/math-pipeline';
export type { ExampleFlow, ExampleRuntime } from './types';

/**
 * Every example flow, in the order the Flows panel offers them: the two that
 * run with no platform first, then the ones that address registered functions.
 */
export const exampleFlows: ExampleFlow[] = [
  helloString,
  mathPipeline,
  failedCheckFanout,
  agenticEmbed,
  agenticKit,
  emailSend,
  codingAgent,
  codingSession,
  agentReviewLoop,
];

/** The example with this id, or undefined. */
export const findExampleFlow = (id: string): ExampleFlow | undefined =>
  exampleFlows.find((example) => example.id === id);

/**
 * The example with this id. Throws when it does not exist: a caller naming an
 * example by id has a graph in mind, and silently handing back an empty one
 * turns a typo into a green run over nothing.
 */
export const getExampleFlow = (id: string): ExampleFlow => {
  const found = findExampleFlow(id);
  if (!found) {
    throw new Error(
      `Unknown example flow "${id}" — known ids: ${exampleFlows.map((e) => e.id).join(', ')}`
    );
  }
  return found;
};
