# FilamentProfit - 3D Printing Cost Calculator

## Problem Statement
Full web application for 3D printing cost calculator to replace Excel spreadsheet. Designed for makers, small businesses, and 3D printing shops.

## User Personas
- **Primary**: Makers and hobbyists tracking print costs
- **Secondary**: Small businesses needing profitability analysis

## Core Requirements
- Italian language interface (€ currency)
- Dark mode by default
- Real-time cost calculations
- JWT authentication
- MongoDB database

## What's Been Implemented (2026-03-28)
- ✅ User authentication (register/login/logout)
- ✅ Filament Manager (CRUD with color preview, cost per gram)
- ✅ Printer/Fixed Costs Settings (depreciation, electricity)
- ✅ Print Cost Calculator (real-time calculations)
- ✅ Sales/Movements Log with filtering
- ✅ Purchase Tracking
- ✅ Dashboard with statistics and charts
- ✅ CSV Export for sales and purchases
- ✅ Dark/Light theme toggle
- ✅ Responsive mobile design

## Architecture
- Frontend: React + Tailwind + Shadcn/UI
- Backend: FastAPI + Motor (async MongoDB)
- Database: MongoDB
- Auth: JWT with httpOnly cookies

## P0 Features (Implemented)
- All modules working
- Real-time calculations
- Data persistence

## P1 Features (Backlog)
- Import Bambu Studio data
- Product profitability ranking
- Invoice generation

## P2 Features (Future)
- Multi-user support
- Inventory tracking with alerts
- Cost simulation before printing
