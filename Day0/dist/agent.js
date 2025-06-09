"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const tavily_search_1 = require("@langchain/community/tools/tavily_search");
const google_genai_1 = require("@langchain/google-genai");
const messages_1 = require("@langchain/core/messages");
const prebuilt_1 = require("@langchain/langgraph/prebuilt");
const langgraph_1 = require("@langchain/langgraph");
const dotenv_1 = require("dotenv");
(0, dotenv_1.configDotenv)();
const tools = [new tavily_search_1.TavilySearchResults({ maxResults: 3 })];
const toolNode = new prebuilt_1.ToolNode(tools);
const llm = new google_genai_1.ChatGoogleGenerativeAI({
    model: 'gemini-2.0-flash',
    temperature: 0,
}).bindTools(tools);
function shouldContinue({ messages }) {
    var _a;
    const lastMessage = messages[messages.length - 1];
    if ((_a = lastMessage.tool_calls) === null || _a === void 0 ? void 0 : _a.length) {
        return 'tools';
    }
    return '__end__';
}
function callModel(state) {
    return __awaiter(this, void 0, void 0, function* () {
        const response = yield llm.invoke(state.messages);
        return { messages: [response] };
    });
}
const workflow = new langgraph_1.StateGraph(langgraph_1.MessagesAnnotation)
    .addNode('agent', callModel)
    .addEdge('__start__', 'agent')
    .addNode('tools', toolNode)
    .addEdge('tools', 'agent')
    .addConditionalEdges('agent', shouldContinue);
const app = workflow.compile();
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        const finalState = yield app.invoke({
            messages: [new messages_1.HumanMessage('What is the weather in Bangalore?')],
        });
        console.log(finalState.messages[finalState.messages.length - 1].content);
        const nextState = yield app.invoke({
            messages: [...finalState.messages, new messages_1.HumanMessage('what about Delhi?')],
        });
        console.log(nextState.messages[nextState.messages.length - 1].content);
    });
}
run();
