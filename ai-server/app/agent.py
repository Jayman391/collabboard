"""AI agent — agentic loop using Anthropic Claude with tool calling."""

import asyncio
from anthropic import AsyncAnthropic
from app.config import settings
from app.tools import TOOLS
from app.executor import execute_tool

MAX_ITERATIONS = 15
AGENT_TIMEOUT = 60  # seconds
MODEL = "claude-sonnet-4-5-20250929"

SYSTEM_PROMPT = """You are an AI assistant for CollabBoard, a collaborative whiteboard application.
You help users create, arrange, and manage objects on a shared whiteboard.

You have tools to create sticky notes, shapes, frames, connectors, and to move/resize/recolor/delete objects.

Guidelines:
- Always call getBoardState first if you need to know what's currently on the board.
- When creating layouts (grids, SWOT, kanban, etc.), calculate positions carefully with consistent spacing.
- Use appropriate colors: yellow (#FDFD96) for general sticky notes, pink (#FFB7B2) for issues/problems,
  green (#B5EAD7) for positives, blue (#C7CEEA) for ideas, orange (#FFD8B1) for action items.
- Standard spacing: 220px between sticky notes horizontally, 220px vertically (they are 200x200).
- For SWOT analysis: create 4 colored quadrants with labeled sticky notes or frames.
- For kanban/columns: create frames as column headers with sticky notes underneath.
- Be precise with positioning — overlapping objects look messy.
- You can create multiple objects in sequence by calling tools one after another.

Layout Templates:
- SWOT: 2x2 grid. Strengths (green, top-left), Weaknesses (pink, top-right),
  Opportunities (blue, bottom-left), Threats (orange, bottom-right). Each quadrant ~300x300.
- Kanban: Columns spaced 320px apart. Frame headers on top, sticky notes below.
- Retrospective: 3 columns — "What Went Well" (green), "What Didn't" (pink), "Action Items" (orange).
- Grid: Arrange items with consistent spacing, typically 220px apart.
"""


async def _run_agent_loop(board_id: str, user_message: str) -> str:
    """Inner agent loop without timeout."""
    client = AsyncAnthropic(api_key=settings.anthropic_api_key)

    messages = [{"role": "user", "content": user_message}]

    for _ in range(MAX_ITERATIONS):
        response = await client.messages.create(
            model=MODEL,
            max_tokens=4096,
            system=SYSTEM_PROMPT,
            tools=TOOLS,
            messages=messages,
        )

        # If no tool use, we're done — extract text response
        if response.stop_reason == "end_turn":
            text_parts = [block.text for block in response.content if block.type == "text"]
            return "\n".join(text_parts) if text_parts else "Done!"

        # Collect tool calls and execute in parallel
        tool_calls = [
            block for block in response.content if block.type == "tool_use"
        ]

        if tool_calls:
            results = await asyncio.gather(
                *[execute_tool(tc.name, tc.input, board_id) for tc in tool_calls]
            )
            tool_results = [
                {
                    "type": "tool_result",
                    "tool_use_id": tc.id,
                    "content": result,
                }
                for tc, result in zip(tool_calls, results)
            ]
        else:
            tool_results = []

        # Add assistant message and tool results to conversation
        messages.append({"role": "assistant", "content": response.content})
        messages.append({"role": "user", "content": tool_results})

    return "Reached maximum iterations. Some actions may have been completed."


async def run_agent(board_id: str, user_message: str) -> str:
    """Run the AI agent loop with a timeout."""
    try:
        return await asyncio.wait_for(
            _run_agent_loop(board_id, user_message),
            timeout=AGENT_TIMEOUT,
        )
    except asyncio.TimeoutError:
        return "The AI agent took too long to respond. Some actions may have been completed."
