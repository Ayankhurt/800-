
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const openapiPath = path.join(__dirname, 'openapi.yaml');
let openapiContent = fs.readFileSync(openapiPath, 'utf8');

// New Paths to Append
const newPaths = `
  /ai/generate-contract:
    post:
      tags:
        - ai
      summary: Generate AI Contract
      security:
        - bearerAuth: []
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                bidId:
                  type: string
                projectId:
                  type: string
                ownerNotes:
                  type: string
      responses:
        '200':
          description: Successful response
        '401':
          description: Unauthorized
        '500':
          description: Server Error

  /ai/contracts/{id}:
    get:
      tags:
        - ai
      summary: Get AI Contract
      security:
        - bearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Successful response
        '404':
          description: Not found
        '500':
          description: Server Error

  /ai/contracts/{id}/finalize:
    post:
      tags:
        - ai
      summary: Finalize AI Contract
      security:
        - bearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Finalized successfully
        '500':
          description: Server Error

  /ai/milestones/{id}/analyze-progress:
    post:
      tags:
        - ai
      summary: Analyze Progress Photos
      security:
        - bearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                photoUrls:
                  type: array
                  items:
                    type: string
                notes:
                  type: string
      responses:
        '200':
          description: Analysis successful
        '500':
          description: Server Error

  /ai/projects/{id}/generate-timeline:
    post:
      tags:
        - ai
      summary: Generate Project Timeline
      security:
        - bearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Timeline generated
        '500':
          description: Server Error

  /payments/stripe/connect:
    post:
      tags:
        - payments
      summary: Create Stripe Connect Account
      security:
        - bearerAuth: []
      responses:
        '200':
          description: Account created
        '500':
          description: Server Error

  /payments/stripe/connect/status:
    get:
      tags:
        - payments
      summary: Get Stripe Account Status
      security:
        - bearerAuth: []
      responses:
        '200':
          description: Status retrieved
        '500':
          description: Server Error

  /payments/stripe/connect/link:
    post:
      tags:
        - payments
      summary: Create Onboarding Link
      security:
        - bearerAuth: []
      responses:
        '200':
          description: Link created
        '500':
          description: Server Error

  /payments/projects/{id}/escrow/deposit:
    post:
      tags:
        - payments
      summary: Deposit to Escrow
      security:
        - bearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                amount:
                  type: number
                paymentMethodId:
                  type: string
      responses:
        '200':
          description: Deposit successful
        '500':
          description: Server Error

  /payments/projects/{id}/escrow/release:
    post:
      tags:
        - payments
      summary: Release Escrow Funds
      security:
        - bearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Funds released
        '500':
          description: Server Error

  /payments/webhook:
    post:
      tags:
        - payments
      summary: Stripe Webhook
      responses:
        '200':
          description: Received

  /upload/portfolio:
    post:
      tags:
        - upload
      summary: Upload Portfolio Image
      security:
        - bearerAuth: []
      requestBody:
        content:
          multipart/form-data:
            schema:
              type: object
              properties:
                file:
                  type: string
                  format: binary
      responses:
        '200':
          description: Upload successful

  /upload/progress:
    post:
      tags:
        - upload
      summary: Upload Progress Photo
      security:
        - bearerAuth: []
      requestBody:
        content:
          multipart/form-data:
            schema:
              type: object
              properties:
                file:
                  type: string
                  format: binary
      responses:
        '200':
          description: Upload successful

  /upload/document:
    post:
      tags:
        - upload
      summary: Upload Document
      security:
        - bearerAuth: []
      requestBody:
        content:
          multipart/form-data:
            schema:
              type: object
              properties:
                file:
                  type: string
                  format: binary
      responses:
        '200':
          description: Upload successful

  /admin/moderation/queue:
    get:
      tags:
        - moderation
      summary: Get Moderation Queue
      security:
        - bearerAuth: []
      responses:
        '200':
          description: Queue retrieved

  /admin/moderation/{id}/approve:
    put:
      tags:
        - moderation
      summary: Approve Report
      security:
        - bearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Approved

  /admin/moderation/{id}/reject:
    put:
      tags:
        - moderation
      summary: Reject Report
      security:
        - bearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Rejected

  /admin/verification/queue:
    get:
      tags:
        - moderation
      summary: Get Verification Queue
      security:
        - bearerAuth: []
      responses:
        '200':
          description: Queue retrieved
`;

// Append only if paths: exists (it should)
if (openapiContent.includes('paths:')) {
    if (!openapiContent.includes('/ai/generate-contract')) {
        fs.appendFileSync(openapiPath, newPaths);
        console.log('Successfully appended new API paths to openapi.yaml');
    } else {
        console.log('API paths appear to be present already.');
    }
} else {
    console.error('Could not find paths section in openapi.yaml');
}
