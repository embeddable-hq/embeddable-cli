import { defineCommand } from "citty";
import * as p from "@clack/prompts";
import Table from "cli-table3";
import { ConfigManager } from "../lib/config-manager.js";
import { EmbeddableAPI } from "../lib/api-client.js";
import { ClackPrompts } from "../lib/clack-prompts.js";
import { Logger } from "../utils/logger.js";
import { handleError, CLIError } from "../utils/errors.js";

// Helper function to parse expiry strings like "1h", "24h", "7d" to seconds
function parseExpiry(expiry: string): number {
  const match = expiry.match(/^(\d+)([hdm])$/);
  if (!match) {
    return 86400; // Default to 24 hours
  }

  const [, num, unit] = match;
  const value = parseInt(num, 10);

  switch (unit) {
    case "m":
      return value * 60;
    case "h":
      return value * 3600;
    case "d":
      return value * 86400;
    default:
      return 86400;
  }
}

export function createListCommand() {
  return defineCommand({
    meta: {
      name: "list",
      description: "List all available embeddables/dashboards",
    },
    args: {},
    async run() {
      try {
        const api = await getAuthenticatedAPI();

        const spinner = p.spinner();
        spinner.start("Fetching embeddables...");
        const embeddables = await api.listEmbeddables();
        spinner.stop();

        if (embeddables.length === 0) {
          Logger.info("No embeddables found.");
          return;
        }

        const table = new Table({
          head: ["ID", "Name", "Last Published"],
          colWidths: [38, 40, 25],
        });

        embeddables.forEach((embed) => {
          const lastPublished = (embed as any).lastPublishedAt;
          let publishedDate = "Not published";

          // Check if lastPublishedAt is a valid date string or object
          if (lastPublished) {
            if (typeof lastPublished === "string") {
              publishedDate = new Date(lastPublished).toLocaleString();
            } else if (lastPublished.date || lastPublished.timestamp) {
              publishedDate = new Date(
                lastPublished.date || lastPublished.timestamp,
              ).toLocaleString();
            }
          }

          table.push([embed.id, embed.name, publishedDate]);
        });

        console.log(table.toString());
        Logger.info(`\nFound ${embeddables.length} embeddable(s)`);
      } catch (error) {
        handleError(error);
      }
    },
  });
}

export function createTokenCommand() {
  return defineCommand({
    meta: {
      name: "token",
      description: "Generate a security token for an embeddable",
    },
    args: {
      embeddableId: {
        type: "positional",
        description: "Embeddable ID",
        required: false,
      },
      env: {
        type: "string",
        alias: "e",
        description: "Environment ID (uses default if not specified)",
      },
    },
    async run({ args }) {
      try {
        const api = await getAuthenticatedAPI();
        const config = ConfigManager.getConfig()!;

        let embeddableId = args.embeddableId as string;

        // If no embeddable ID provided, show list and let user select
        if (!embeddableId) {
          const spinner = p.spinner();
          spinner.start("Fetching embeddables...");
          const embeddables = await api.listEmbeddables();
          spinner.stop();

          if (embeddables.length === 0) {
            Logger.error("No embeddables found.");
            process.exit(1);
          }

          const selected = await p.select({
            message: "Select an embeddable:",
            options: embeddables.map((e) => ({
              label: e.name,
              value: e.id,
            })),
          });

          if (p.isCancel(selected)) {
            p.cancel("Token generation cancelled");
            process.exit(0);
          }

          embeddableId = selected as string;
        }

        const environmentId = args.env || config.defaultEnvironment;

        if (!environmentId) {
          throw new CLIError(
            'No environment specified. Use --env or set a default with "embed env set-default"',
          );
        }

        const tokenDetails = await ClackPrompts.getTokenDetails();

        const spinner = p.spinner();
        spinner.start("Generating token...");

        const token = await api.generateSecurityToken(embeddableId, {
          environment: environmentId,
          expiryInSeconds: tokenDetails.expiresIn
            ? parseExpiry(tokenDetails.expiresIn)
            : 86400,
          user: tokenDetails.userId ? { id: tokenDetails.userId } : undefined,
          securityContext: tokenDetails.filters,
        });

        spinner.stop("Token generated successfully", 0);

        console.log("\nSecurity Token:");
        console.log("=".repeat(50));
        console.log(token.token);
        console.log("=".repeat(50));

        if (token.embedUrl) {
          console.log("\nEmbed URL:");
          console.log(token.embedUrl);
        }
      } catch (error) {
        handleError(error);
      }
    },
  });
}

export function createPreviewCommand() {
  return defineCommand({
    meta: {
      name: "preview",
      description: "Preview an embeddable in your browser",
    },
    args: {
      embeddableId: {
        type: "positional",
        description: "Embeddable ID",
        required: false,
      },
      env: {
        type: "string",
        alias: "e",
        description: "Environment ID (uses default if not specified)",
      },
      workspace: {
        type: "string",
        alias: "w",
        description: "Workspace ID (will prompt if not provided)",
      },
    },
    async run({ args }) {
      try {
        const api = await getAuthenticatedAPI();
        const config = ConfigManager.getConfig()!;

        let embeddableId = args.embeddableId as string;

        // If no embeddable ID provided, show list and let user select
        if (!embeddableId) {
          const spinner = p.spinner();
          spinner.start("Fetching embeddables...");
          const embeddables = await api.listEmbeddables();
          spinner.stop();

          if (embeddables.length === 0) {
            Logger.error("No embeddables found.");
            process.exit(1);
          }

          p.intro("🔍 Previewing embeddable");

          const selected = await p.select({
            message: "Select an embeddable to preview:",
            options: embeddables.map((e) => ({
              value: e.id,
              label: e.name || `Embeddable ${e.id}`,
              hint: e.id,
            })),
          });

          if (p.isCancel(selected)) {
            p.cancel("Preview cancelled");
            process.exit(0);
          }

          embeddableId = selected as string;
        }

        // Get workspace ID - use argument or prompt user
        let workspaceId = args.workspace as string;

        if (!workspaceId) {
          const workspaceIdInput = await p.text({
            message: "Enter your workspace ID:",
            placeholder: "e.g., 512cc2a8-9b8c-4ba1-8ca7-5799d8d9a66b",
            validate: (value) => {
              if (!value || value.trim().length === 0) {
                return "Workspace ID is required";
              }
              // Basic UUID validation
              const uuidRegex =
                /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
              if (!uuidRegex.test(value.trim())) {
                return "Please enter a valid workspace ID (UUID format)";
              }
              return undefined; // Valid input
            },
          });

          if (p.isCancel(workspaceIdInput)) {
            p.cancel("Preview cancelled");
            process.exit(0);
          }

          workspaceId = workspaceIdInput.trim();
        }

        // Build the preview URL based on region
        const regionDomain =
          {
            EU: "eu",
            US: "us",
            Dev: "dev",
          }[config.region] || "us";

        // Build the preview URL with workspace ID
        const previewUrl = `https://app.${regionDomain}.embeddable.com/en/workspace/${workspaceId}/builder/${embeddableId}`;

        Logger.info("Preview URL:");
        Logger.log(previewUrl);

        // Try to open in browser
        try {
          const open = (await import("open")).default;
          await open(previewUrl);
          Logger.success("Opening in browser...");
        } catch (error) {
          Logger.debug(`Could not open browser: ${error}`);
          Logger.info("\nCopy and paste this URL in your browser to preview");
        }
      } catch (error) {
        handleError(error);
      }
    },
  });
}

async function getAuthenticatedAPI(): Promise<EmbeddableAPI> {
  const config = ConfigManager.getConfig();

  if (!config) {
    throw new CLIError(
      'Not authenticated. Run "embed init" or "embed auth login" first.',
    );
  }

  return new EmbeddableAPI(config.apiKey, config.region);
}
