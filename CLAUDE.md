# Claude Configuration for Pachislot Favorable Zone Calculator

## Project Overview
This is a React TypeScript application that helps calculate favorable zones for pachislot gaming. The app features AI-powered image recognition to automatically extract game history data from screenshots and calculate favorable zone ranges.

## Key Technologies
- React 19 with TypeScript
- Vite for development and build
- Google Generative AI (Gemini) for image analysis
- Tailwind CSS for styling

## Development Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Project Structure
- `App.tsx` - Main application component
- `components/` - Reusable React components
  - `ImageProcessor.tsx` - Handles image upload and processing
  - `HistoryTable.tsx` - Displays game history data
  - `icons.tsx` - Icon components
- `services/` - External service integrations
  - `geminiService.ts` - Google Gemini AI integration
- `utils/` - Utility functions
  - `calculator.ts` - Favorable zone calculation logic
- `types.ts` - TypeScript type definitions
- `constants.ts` - Application constants

## Key Features
1. **Image Processing**: Upload screenshots of game history and extract data using AI
2. **Manual Data Entry**: Add, edit, and delete game records manually
3. **Favorable Zone Calculation**: Automatically calculate favorable zone ranges based on game history
4. **Data Management**: Add records, clear data, and delete selected entries

## Environment Setup
- Requires Node.js
- Set `GEMINI_API_KEY` in `.env.local` for AI image processing functionality

## Code Style Guidelines
- Uses TypeScript with strict typing
- React functional components with hooks
- Tailwind CSS for consistent styling
- Japanese language UI (有利区間計算ツール)

## Testing
No specific test framework is configured. If adding tests, consider:
- Jest for unit testing
- React Testing Library for component testing
- Cypress for end-to-end testing

## Deployment
The app can be deployed as a static site using `npm run build` output.