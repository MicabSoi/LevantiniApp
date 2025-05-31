# Figma MCP Server

A Model Context Protocol (MCP) server that provides AI agents with direct access to Figma design data, enabling more accurate design implementations and seamless design-to-code workflows.

## Features

- **Get Figma Files**: Retrieve complete file information including frames, components, and design tokens
- **Access Specific Nodes**: Get detailed information about specific components or frames
- **Team & Project Management**: Browse team projects and project files
- **File Search**: Search for specific files within teams
- **User Information**: Get current user details

## Installation

1. Navigate to the figma-mcp-server directory:
```bash
cd figma-mcp-server
```

2. Install dependencies:
```bash
npm install
```

## Configuration

### Environment Variables

You can set your Figma Personal Access Token as an environment variable:

```bash
export FIGMA_ACCESS_TOKEN=your_figma_token_here
```

Or the server will use the hardcoded token in the code (for development purposes).

### Adding to Cursor

1. Open Cursor Settings
2. Navigate to `Features` > `MCP`
3. Click "+ Add New MCP Server"
4. Configure the server:
   - **Name**: `Figma MCP`
   - **Type**: `stdio`
   - **Command**: `node /path/to/your/workspace/figma-mcp-server/index.js`

## Available Tools

### `get_figma_file`
Get complete information about a Figma file.
- **Parameters**: `file_key` (string) - The file key from the Figma URL

### `get_figma_file_nodes`
Get specific nodes/components from a Figma file.
- **Parameters**: 
  - `file_key` (string) - The file key from the Figma URL
  - `node_ids` (string) - Comma-separated list of node IDs

### `get_team_projects`
Get all projects in a Figma team.
- **Parameters**: `team_id` (string) - The team ID

### `get_project_files`
Get all files in a Figma project.
- **Parameters**: `project_id` (string) - The project ID

### `search_figma_files`
Search for files in a Figma team.
- **Parameters**: 
  - `team_id` (string) - The team ID to search in
  - `query` (string, optional) - Search query for file names

### `get_figma_user_info`
Get information about the current Figma user.
- **Parameters**: None

## Usage Examples

Once configured in Cursor, you can use the AI agent with prompts like:

- "Get the design specifications from my Figma file and create React components"
- "Analyze the color palette used in this Figma design"
- "Generate TypeScript interfaces based on the data shown in this Figma prototype"
- "Create CSS styles that match the typography in my Figma design system"

## Finding Figma IDs

- **File Key**: Found in the URL `https://figma.com/file/FILE_KEY/File-Name`
- **Node IDs**: Right-click on any layer in Figma → "Copy link" → extract ID from URL
- **Team ID**: Found in team settings or URL when browsing team
- **Project ID**: Found in project URL or when browsing projects

## Troubleshooting

1. **Authentication Issues**: Ensure your Figma Personal Access Token has the necessary permissions
2. **Node Not Found**: Verify the node IDs are correct and accessible
3. **Rate Limiting**: The Figma API has rate limits; the server will handle basic error cases

## Development

To run in development mode with auto-restart:
```bash
npm run dev
```

## Security Notes

- Keep your Figma Personal Access Token secure
- Consider using environment variables for production deployments
- The token provides access to all files the user can access in Figma 