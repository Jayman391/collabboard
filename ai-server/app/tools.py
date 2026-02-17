"""Tool definitions for the AI board agent."""

TOOLS = [
    {
        "name": "createStickyNote",
        "description": "Create a sticky note on the board. Returns the created object's ID.",
        "input_schema": {
            "type": "object",
            "properties": {
                "text": {"type": "string", "description": "Text content of the sticky note"},
                "x": {"type": "number", "description": "X position on the board"},
                "y": {"type": "number", "description": "Y position on the board"},
                "color": {
                    "type": "string",
                    "description": "Background color (hex). Common sticky note colors: #FDFD96 (yellow), #FFB7B2 (pink), #B5EAD7 (green), #C7CEEA (blue), #FFD8B1 (orange)",
                },
                "width": {"type": "number", "description": "Width of the sticky note (default 200)"},
                "height": {"type": "number", "description": "Height of the sticky note (default 200)"},
            },
            "required": ["text", "x", "y"],
        },
    },
    {
        "name": "createShape",
        "description": "Create a shape (rectangle, circle, or line) on the board.",
        "input_schema": {
            "type": "object",
            "properties": {
                "type": {
                    "type": "string",
                    "enum": ["rectangle", "circle", "line"],
                    "description": "Type of shape",
                },
                "x": {"type": "number", "description": "X position"},
                "y": {"type": "number", "description": "Y position"},
                "width": {"type": "number", "description": "Width of the shape"},
                "height": {"type": "number", "description": "Height of the shape"},
                "color": {"type": "string", "description": "Fill color (hex)"},
                "text": {"type": "string", "description": "Optional text label inside the shape"},
            },
            "required": ["type", "x", "y", "width", "height"],
        },
    },
    {
        "name": "createFrame",
        "description": "Create a frame (grouping area) on the board with a title label.",
        "input_schema": {
            "type": "object",
            "properties": {
                "title": {"type": "string", "description": "Frame title/label"},
                "x": {"type": "number", "description": "X position"},
                "y": {"type": "number", "description": "Y position"},
                "width": {"type": "number", "description": "Width of the frame"},
                "height": {"type": "number", "description": "Height of the frame"},
                "color": {"type": "string", "description": "Frame border/background color (hex)"},
            },
            "required": ["title", "x", "y", "width", "height"],
        },
    },
    {
        "name": "createConnector",
        "description": "Create a connector/arrow between two objects on the board.",
        "input_schema": {
            "type": "object",
            "properties": {
                "fromId": {"type": "string", "description": "ID of the source object"},
                "toId": {"type": "string", "description": "ID of the target object"},
                "color": {"type": "string", "description": "Connector color (hex)"},
            },
            "required": ["fromId", "toId"],
        },
    },
    {
        "name": "moveObject",
        "description": "Move an existing object to a new position.",
        "input_schema": {
            "type": "object",
            "properties": {
                "objectId": {"type": "string", "description": "ID of the object to move"},
                "x": {"type": "number", "description": "New X position"},
                "y": {"type": "number", "description": "New Y position"},
            },
            "required": ["objectId", "x", "y"],
        },
    },
    {
        "name": "resizeObject",
        "description": "Resize an existing object.",
        "input_schema": {
            "type": "object",
            "properties": {
                "objectId": {"type": "string", "description": "ID of the object to resize"},
                "width": {"type": "number", "description": "New width"},
                "height": {"type": "number", "description": "New height"},
            },
            "required": ["objectId", "width", "height"],
        },
    },
    {
        "name": "updateText",
        "description": "Update the text content of an existing object.",
        "input_schema": {
            "type": "object",
            "properties": {
                "objectId": {"type": "string", "description": "ID of the object to update"},
                "newText": {"type": "string", "description": "New text content"},
            },
            "required": ["objectId", "newText"],
        },
    },
    {
        "name": "changeColor",
        "description": "Change the color of an existing object.",
        "input_schema": {
            "type": "object",
            "properties": {
                "objectId": {"type": "string", "description": "ID of the object"},
                "color": {"type": "string", "description": "New color (hex)"},
            },
            "required": ["objectId", "color"],
        },
    },
    {
        "name": "deleteObjects",
        "description": "Delete one or more objects from the board.",
        "input_schema": {
            "type": "object",
            "properties": {
                "objectIds": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "List of object IDs to delete",
                },
            },
            "required": ["objectIds"],
        },
    },
    {
        "name": "getBoardState",
        "description": "Get all current objects on the board. Call this first to understand what's on the board before making changes.",
        "input_schema": {
            "type": "object",
            "properties": {},
            "required": [],
        },
    },
]
