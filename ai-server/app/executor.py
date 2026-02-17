"""Tool executor — maps AI tool calls to Supabase CRUD operations."""

import uuid
import time
from typing import Any

from supabase import create_client, Client
from app.config import settings


def get_supabase() -> Client:
    """Create Supabase client with service role key (bypasses RLS)."""
    return create_client(settings.supabase_url, settings.supabase_service_role_key)


async def execute_tool(tool_name: str, tool_input: dict[str, Any], board_id: str) -> str:
    """Execute a tool and return the result as a string."""
    db = get_supabase()

    if tool_name == "createStickyNote":
        return _create_object(db, board_id, "sticky_note", tool_input)
    elif tool_name == "createShape":
        return _create_object(db, board_id, tool_input.get("type", "rectangle"), tool_input)
    elif tool_name == "createFrame":
        return _create_object(db, board_id, "frame", tool_input)
    elif tool_name == "createConnector":
        return _create_connector(db, board_id, tool_input)
    elif tool_name == "moveObject":
        return _update_object(db, tool_input["objectId"], {"x": tool_input["x"], "y": tool_input["y"]})
    elif tool_name == "resizeObject":
        return _update_object(db, tool_input["objectId"], {"width": tool_input["width"], "height": tool_input["height"]})
    elif tool_name == "updateText":
        return _update_object(db, tool_input["objectId"], {"text": tool_input["newText"]})
    elif tool_name == "changeColor":
        return _update_object(db, tool_input["objectId"], {"color": tool_input["color"]})
    elif tool_name == "deleteObjects":
        return _delete_objects(db, tool_input["objectIds"])
    elif tool_name == "getBoardState":
        return _get_board_state(db, board_id)
    else:
        return f"Unknown tool: {tool_name}"


def _create_object(db: Client, board_id: str, obj_type: str, params: dict[str, Any]) -> str:
    obj_id = str(uuid.uuid4())
    now = time.time()

    record = {
        "id": obj_id,
        "board_id": board_id,
        "type": obj_type,
        "x": params.get("x", 0),
        "y": params.get("y", 0),
        "width": params.get("width", 200),
        "height": params.get("height", 200),
        "rotation": 0,
        "color": params.get("color", "#FDFD96" if obj_type == "sticky_note" else "#4ECDC4"),
        "text": params.get("text", params.get("title", "")),
        "z_index": int(now * 1000),
        "metadata": {},
    }

    result = db.table("board_objects").insert(record).execute()
    if result.data:
        return f"Created {obj_type} with ID: {obj_id}"
    return f"Failed to create {obj_type}"


def _create_connector(db: Client, board_id: str, params: dict[str, Any]) -> str:
    obj_id = str(uuid.uuid4())
    now = time.time()

    record = {
        "id": obj_id,
        "board_id": board_id,
        "type": "connector",
        "x": 0,
        "y": 0,
        "width": 0,
        "height": 0,
        "rotation": 0,
        "color": params.get("color", "#888888"),
        "text": "",
        "z_index": int(now * 1000),
        "metadata": {
            "fromId": params["fromId"],
            "toId": params["toId"],
            "style": params.get("style", "arrow"),
        },
    }

    result = db.table("board_objects").insert(record).execute()
    if result.data:
        return f"Created connector with ID: {obj_id}"
    return "Failed to create connector"


def _update_object(db: Client, object_id: str, updates: dict[str, Any]) -> str:
    result = db.table("board_objects").update(updates).eq("id", object_id).execute()
    if result.data:
        return f"Updated object {object_id}"
    return f"Object {object_id} not found"


def _delete_objects(db: Client, object_ids: list[str]) -> str:
    for oid in object_ids:
        db.table("board_objects").delete().eq("id", oid).execute()
    return f"Deleted {len(object_ids)} object(s)"


def _get_board_state(db: Client, board_id: str) -> str:
    result = (
        db.table("board_objects")
        .select("id, type, x, y, width, height, color, text, z_index")
        .eq("board_id", board_id)
        .order("z_index", desc=False)
        .execute()
    )
    objects = result.data or []
    if not objects:
        return "The board is empty — no objects exist yet."

    lines = [f"Board has {len(objects)} object(s):"]
    for obj in objects:
        text_preview = obj["text"][:50] + "..." if len(obj.get("text", "")) > 50 else obj.get("text", "")
        lines.append(
            f'  - {obj["type"]} (id={obj["id"]}) at ({obj["x"]:.0f}, {obj["y"]:.0f}) '
            f'{obj["width"]:.0f}x{obj["height"]:.0f} color={obj["color"]} text="{text_preview}"'
        )
    return "\n".join(lines)
