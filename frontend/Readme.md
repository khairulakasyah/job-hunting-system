# Job Hunter — Job Application Tracking Dashboard

Full-stack job application tracking system with AI-powered insights, Kanban board, email templates, and analytics.

## Tech Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS v4, Vite
- **Backend:** Laravel (PHP), MySQL/PostgreSQL
- **Scraper:** Python, Flask, Playwright
- **Deployment:** Docker, Nginx

## Getting Started

```bash
# Frontend
cd frontend
npm install
npm run dev

# Backend
cd backend
composer install
cp .env.example .env   # configure your database
php artisan key:generate
php artisan migrate
php artisan serve

# Scraper
cd scraper
pip install -r requirements.txt
playwright install chromium
python app.py
```

## Features

- Job application tracking with Kanban board
- AI-powered chat & cover letter generation
- Email template management
- Application analytics dashboard
- Job board scraping
- Interview preparation tools
- Offer comparison
- Contact/CRM management
- Notes with Kanban organization
- User settings & profile management
- Admin dashboard with user analytics

## Docker Deployment

```bash
docker compose up --build
```
