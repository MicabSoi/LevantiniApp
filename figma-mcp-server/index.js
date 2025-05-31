#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import fetch from "node-fetch";
import { z } from "zod";

// Environment variables
const FIGMA_ACCESS_TOKEN = process.env.FIGMA_ACCESS_TOKEN || "figd_elk9EZhrVhpwUVBhH-ZZ8Hl8sDcW4Byxy-PjMVKg";
const FIGMA_API_BASE = "https://api.figma.com/v1";

// Validation schemas
const GetFileSchema = z.object({
  file_key: z.string().describe("The Figma file key from the URL"),
});

const GetFileNodesSchema = z.object({
  file_key: z.string().describe("The Figma file key from the URL"),
  node_ids: z.string().describe("Comma-separated list of node IDs to retrieve"),
});

const GetTeamProjectsSchema = z.object({
  team_id: z.string().describe("The team ID to get projects for"),
});

const GetProjectFilesSchema = z.object({
  project_id: z.string().describe("The project ID to get files for"),
});

const SearchFilesSchema = z.object({
  team_id: z.string().describe("The team ID to search in"),
  query: z.string().optional().describe("Search query for file names"),
});

class FigmaAPI {
  constructor(accessToken) {
    this.accessToken = accessToken;
    this.headers = {
      "X-Figma-Token": accessToken,
      "Content-Type": "application/json",
    };
  }

  async makeRequest(endpoint) {
    const url = `${FIGMA_API_BASE}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        headers: this.headers,
      });

      if (!response.ok) {
        throw new Error(`Figma API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to fetch from Figma API: ${error.message}`
      );
    }
  }

  async getFile(fileKey) {
    return await this.makeRequest(`/files/${fileKey}`);
  }

  async getFileNodes(fileKey, nodeIds) {
    const nodeIdsParam = nodeIds.split(',').map(id => id.trim()).join(',');
    return await this.makeRequest(`/files/${fileKey}/nodes?ids=${nodeIdsParam}`);
  }

  async getTeamProjects(teamId) {
    return await this.makeRequest(`/teams/${teamId}/projects`);
  }

  async getProjectFiles(projectId) {
    return await this.makeRequest(`/projects/${projectId}/files`);
  }

  async searchFiles(teamId, query = "") {
    const endpoint = query 
      ? `/teams/${teamId}/files?search=${encodeURIComponent(query)}`
      : `/teams/${teamId}/files`;
    return await this.makeRequest(endpoint);
  }

  async getMe() {
    return await this.makeRequest('/me');
  }
}

class FigmaMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: "figma-mcp-server",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.figmaAPI = new FigmaAPI(FIGMA_ACCESS_TOKEN);
    this.setupToolHandlers();
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "get_figma_file",
            description: "Get complete information about a Figma file including all frames, components, and design tokens",
            inputSchema: {
              type: "object",
              properties: {
                file_key: {
                  type: "string",
                  description: "The Figma file key from the URL (e.g., 'abc123def456' from https://figma.com/file/abc123def456/My-Design)",
                },
              },
              required: ["file_key"],
            },
          },
          {
            name: "get_figma_file_nodes",
            description: "Get specific nodes/components from a Figma file by their IDs",
            inputSchema: {
              type: "object",
              properties: {
                file_key: {
                  type: "string",
                  description: "The Figma file key from the URL",
                },
                node_ids: {
                  type: "string", 
                  description: "Comma-separated list of node IDs to retrieve",
                },
              },
              required: ["file_key", "node_ids"],
            },
          },
          {
            name: "get_team_projects",
            description: "Get all projects in a Figma team",
            inputSchema: {
              type: "object",
              properties: {
                team_id: {
                  type: "string",
                  description: "The team ID to get projects for",
                },
              },
              required: ["team_id"],
            },
          },
          {
            name: "get_project_files",
            description: "Get all files in a Figma project",
            inputSchema: {
              type: "object",
              properties: {
                project_id: {
                  type: "string",
                  description: "The project ID to get files for",
                },
              },
              required: ["project_id"],
            },
          },
          {
            name: "search_figma_files",
            description: "Search for files in a Figma team",
            inputSchema: {
              type: "object",
              properties: {
                team_id: {
                  type: "string",
                  description: "The team ID to search in",
                },
                query: {
                  type: "string",
                  description: "Search query for file names (optional)",
                },
              },
              required: ["team_id"],
            },
          },
          {
            name: "get_figma_user_info",
            description: "Get information about the current Figma user",
            inputSchema: {
              type: "object",
              properties: {},
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case "get_figma_file": {
            const { file_key } = GetFileSchema.parse(args);
            const result = await this.figmaAPI.getFile(file_key);
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          case "get_figma_file_nodes": {
            const { file_key, node_ids } = GetFileNodesSchema.parse(args);
            const result = await this.figmaAPI.getFileNodes(file_key, node_ids);
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          case "get_team_projects": {
            const { team_id } = GetTeamProjectsSchema.parse(args);
            const result = await this.figmaAPI.getTeamProjects(team_id);
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          case "get_project_files": {
            const { project_id } = GetProjectFilesSchema.parse(args);
            const result = await this.figmaAPI.getProjectFiles(project_id);
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          case "search_figma_files": {
            const { team_id, query } = SearchFilesSchema.parse(args);
            const result = await this.figmaAPI.searchFiles(team_id, query);
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          case "get_figma_user_info": {
            const result = await this.figmaAPI.getMe();
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            );
        }
      } catch (error) {
        if (error instanceof z.ZodError) {
          throw new McpError(
            ErrorCode.InvalidParams,
            `Invalid parameters: ${error.errors.map(e => `${e.path}: ${e.message}`).join(", ")}`
          );
        }
        throw error;
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Figma MCP server running on stdio");
  }
}

const server = new FigmaMCPServer();
server.run().catch(console.error); 