# CampusFix — Campus Issue Reporting & Resolution Tracker

A modern full-stack CA3 mini project using the React + Vite frontend, Express API, and MongoDB. The UI has been redesigned with a navy/indigo campus-operations theme, responsive layout, summary cards, category insights, filtering, CSV export, and a working report form modal.

## Features
- Create a campus issue report from any **Report an issue** button.
- Required fields: title, category, priority, location, description, reporter name, and email.
- View reports in a searchable/filterable dashboard.
- Update status: Open → In Progress → Resolved.
- Edit and delete reports.
- Export the currently filtered reports as CSV.
- Responsive layout for desktop, tablet, and mobile.
- MongoDB persistence through the Express backend.

## Requirements
- Node.js 20 or newer (Node.js 22 recommended)
- MongoDB Community Server installed and running locally
- MongoDB Compass is optional, for viewing the database

## Run on Windows (recommended)
1. Extract this ZIP to a normal folder, for example `Desktop\CampusFix_Campus_Issue_Tracker`.
2. Make sure the MongoDB Server service is running. MongoDB Compass alone is not the database server.
3. Open PowerShell in the extracted `CampusFix_Campus_Issue_Tracker` folder.
4. In Terminal 1 run:
   ```powershell
   cd server
   npm install
   npm start
   ```
5. Open a second terminal in the project folder. In Terminal 2 run:
   ```powershell
   cd client
   npm install
   npm run dev
   ```
6. Open the URL Vite prints, usually `http://localhost:5173`.

Keep both terminals running while using the website. Do not open `index.html` directly from File Explorer; use the Vite URL.

## Database connection
- Connection URI: `mongodb://127.0.0.1:27017`
- Database: `sitSecA`
- Collection: `campusIssues`

The backend connects using the URI above. You can override the connection with environment variables `MONGO_URI` and `DB_NAME`. MongoDB creates the database and collection when the first issue is saved. Existing `students` data is not modified.

## Troubleshooting
- **Report an issue button:** The header button, hero button, sidebar button, and empty-state button all open the same report form. If a button appears not to respond, make sure the page is opened using the Vite URL and refresh after replacing the old project files.
- **Cannot connect to backend:** Check that the backend terminal says `CampusFix API running at http://localhost:5000`. Ensure MongoDB Server is running too.
- **MongoDB connection refused:** Open Windows Services (`Win + R` → `services.msc`), find the MongoDB Server service, and start it.
- **Port already in use:** Stop the other process using port 5000 (backend) or let Vite choose another available frontend port.
- **Blank/old-looking page:** Stop the old frontend with `Ctrl + C`, ensure you are in this ZIP's `client` folder, run `npm run dev`, and hard-refresh the page (`Ctrl + Shift + R`).

## API routes
- `GET /api/health` — API health check
- `GET /api/issues` — list issues
- `POST /api/issues` — create issue
- `PUT /api/issues/:id` — edit issue or update status
- `DELETE /api/issues/:id` — delete issue

## GitHub
Do not upload `node_modules`, `.env` files, passwords, or credentials. The project `.gitignore` excludes generated dependencies and environment files.
