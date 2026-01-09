# WBCIA - World Bank & CIA Data Visualizer

A Next.js application to visualize World Bank data with multiple series, adaptive search, and interactive charts.

## Features

- **Country Selection**: Choose any country from the World Bank database.
- **Source Selection**: Toggle between World Bank and CIA World Factbook (CIA data currently placeholder).
- **Adaptive Search**: Search for indicators (datasets) by name (e.g., "GDP", "Population").
- **Multi-Series Charting**:
  - Add multiple datasets to the same chart.
  - Each series has its own color and Y-axis on the left.
  - Interactive tooltips and legends.
- **Time Range Control**: 
  - Change the X-axis year range using text inputs.
  - Zoom/Brush control on the chart.
  - Initial range automatically adapts to the data.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Data**: World Bank API (v2)

## Local Development

1.  Navigate to the app directory:
    ```bash
    cd wbcia-app
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Run the development server:
    ```bash
    npm run dev
    ```

4.  Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment on Railway.com

1.  Push this repository to GitHub.
2.  Log in to [Railway.com](https://railway.app/).
3.  Click "New Project" -> "Deploy from GitHub repo".
4.  Select this repository.
5.  Railway will automatically detect the Next.js app.
6.  Click "Deploy".
    - Railway automatically handles `npm install`, `npm run build`, and `npm start`.
    - It respects the `PORT` environment variable.

## Project Structure

- `wbcia-app/`: The Next.js application.
  - `components/`: UI components (Dashboard, Chart, ControlPanel).
  - `lib/`: API services and utilities.
  - `app/`: Next.js App Router pages.