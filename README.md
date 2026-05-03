# SkillMatchPH

SkillMatchPH is a career pathing application designed for senior high school students in the Philippines. It helps students find the best college programs and universities based on their SHS strand and interests.

## 🚀 Tech Stack

- **Frontend**: React (Vite)
- **Styling**: Vanilla CSS (Modern Kinetic Aesthetic)
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Database & Auth**: Supabase
- **Data Fetching**: SWR

## 🛠️ Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd SkillMatchPH
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up Environment Variables:**
   Create a `.env.local` file in the root directory and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

### Running Locally

To start the development server:
```bash
npm run dev
```
The application will be available at `http://localhost:5173`.

## 📦 Available Scripts

- `npm run dev`: Starts the Vite development server.
- `npm run build`: Builds the application for production.
- `npm run preview`: Locally previews the production build.
- `npm run lint`: Runs ESLint to check for code quality issues.

## ✨ Features

- **Student Portal**:
  - Interactive dashboard for career exploration.
  - Program discovery based on SHS strands.
  - Profile management.
- **Admin Dashboard**:
  - **Student Management**: CRUD operations for student accounts, including status updates (Pending, Approved, Rejected).
  - **University Management**: CRUD operations for universities and associating them with programs.
  - **Program Management**: Manage available career paths and college programs.
- **Secure Authentication**: Integrated with Supabase Auth for student and admin roles.
- **Modern Kinetic UI**: A polished, glassmorphic design system with smooth transitions.

## 📂 Folder Structure

- `src/components`: Reusable UI components.
- `src/pages`: Main application pages (Student & Admin).
- `src/context`: React Context providers (Auth, etc.).
- `src/lib`: Third-party library configurations (Supabase client).
- `src/styles`: CSS modules and global styles.

