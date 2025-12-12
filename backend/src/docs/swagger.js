/**
 * Swagger/OpenAPI 3.1 Documentation Loader
 * Loads and serves OpenAPI specification from YAML file
 */
import swaggerUi from "swagger-ui-express";
import fs from "fs";
import path from "path";
import yaml from "js-yaml";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load the FULL OpenAPI document
const openApiPath = path.join(__dirname, "../../openapi_full.yaml");
let openApiDocument;
try {
  openApiDocument = yaml.load(fs.readFileSync(openApiPath, "utf8"));
  if (!openApiDocument || !openApiDocument.openapi) {
    throw new Error("Invalid OpenAPI specification file loaded globally.");
  }
  console.log("✅ OpenAPI document loaded globally from openapi_full.yaml");
} catch (error) {
  console.error("❌ Failed to load global OpenAPI document:", error.message);
  openApiDocument = null; // Ensure it's null if loading fails
}


/**
 * Setup Swagger UI with OpenAPI 3.1 specification
 * @param {Express} app - Express application instance
 */
export const swaggerSetup = (app) => {
  try {
    if (!openApiDocument) {
      throw new Error("OpenAPI document was not loaded successfully at startup.");
    }

    // Setup Swagger UI with explorer enabled
    // For Vercel/serverless: Use CDN assets to avoid static file serving issues
    const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV;

    const swaggerUiOptions = {
      explorer: true,
      customCss: ".swagger-ui .topbar { display: none }",
      customSiteTitle: "BidRoom API Documentation",
      swaggerOptions: {
        persistAuthorization: true,
      },
    };

    // Use CDN assets on Vercel to avoid static file serving issues
    if (isVercel) {
      swaggerUiOptions.customJs = [
        "https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui-bundle.js",
        "https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui-standalone-preset.js",
      ];
      swaggerUiOptions.customCssUrl = "https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui.css";
    }

    // Serve dynamic OpenAPI spec with current server URL
    app.get("/api-docs/swagger.json", (req, res) => {
      const docCopy = JSON.parse(JSON.stringify(openApiDocument));

      // Get the base URL from the request
      // Vercel always uses HTTPS, so prioritize that
      let protocol = 'https';

      // Check x-forwarded-proto header (Vercel sets this)
      if (req.headers['x-forwarded-proto']) {
        protocol = req.headers['x-forwarded-proto'].split(',')[0].trim();
      }
      // If on Vercel or vercel.app domain, force HTTPS
      else if (process.env.VERCEL || (req.get('host') || req.headers.host || '').includes('vercel.app')) {
        protocol = 'https';
      }
      // Otherwise use req.protocol (for local development)
      else {
        protocol = req.protocol || 'http';
      }

      const host = req.get('host') || req.headers.host;
      const baseUrl = `${protocol}://${host}`;

      // Update servers array with dynamic URL
      docCopy.servers = [
        {
          url: `${baseUrl}/api/v1`,
          description: process.env.VERCEL ? 'Vercel deployment' : 'Current server'
        },
        {
          url: "http://localhost:5000/api/v1",
          description: "Development server (local)"
        }
      ];

      res.setHeader("Content-Type", "application/json");
      res.send(docCopy);
    });

    // Setup Swagger UI to use the dynamic spec endpoint
    const finalOptions = {
      ...swaggerUiOptions,
      swaggerOptions: {
        ...swaggerUiOptions.swaggerOptions,
        url: "/api-docs/swagger.json", // Use the dynamic spec endpoint
      },
    };

    app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(null, finalOptions));

    console.log("✅ Swagger UI loaded successfully from openapi.yaml");
    return openApiDocument;
  } catch (error) {
    console.error("❌ Failed to load Swagger documentation:", error.message);
    console.error("Error details:", error);

    // Don't crash the server, just log the error
    app.use("/api-docs", (req, res) => {
      res.status(500).json({
        success: false,
        message: "API documentation is currently unavailable",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    });

    return null;
  }
};

export default swaggerSetup;
