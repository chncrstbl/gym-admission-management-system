# GAMS Project Architecture Diagram

```mermaid
flowchart LR
    User[User / Staff / Member] --> Browser[Web Browser]
    Browser --> Frontend[React Frontend\nVite + React Router]

    Frontend --> App[App.jsx\nQueryClientProvider + Toaster]
    App --> Routes[src/routes/AppRoutes.jsx]

    Routes --> AdminAuth[ProtectedRoute\nAdmin access]
    Routes --> MemberAuth[MemberProtectedRoute\nMember access]

    AdminAuth --> Home[Dashboard Pages\nHome / Overview / Members / Finance / Equipment]
    MemberAuth --> MemberPortal[Member Portal\nMemberDashboard]

    Home --> UIComponents[Reusable UI Components\nHeader, Sidebar, Cards, Modals, Tables]
    MemberPortal --> MemberComponents[Member Layout + Dashboard Widgets]

    Frontend --> API[Express Backend\nbackend/index.js]
    API --> CORS[CORS + JSON + Cookie Parser]
    API --> RateLimit[Rate Limiter\n/api/login]

    API --> RouteGroups[Route Modules]
    RouteGroups --> MemberRoutes[backend/routes/memberRoutes.js]
    RouteGroups --> FinanceRoutes[backend/routes/financeRoutes.js]
    RouteGroups --> EquipmentRoutes[backend/routes/equipmentRoutes.js]
    RouteGroups --> ActivityRoutes[backend/routes/activityRoutes.js]
    RouteGroups --> AuthRoutes[backend/routes/authRoutes.js]

    MemberRoutes --> MemberCtrl[memberController.js\nCRUD + stats + QR check-in]
    FinanceRoutes --> FinanceCtrl[financeController.js\nPayments + reports]
    EquipmentRoutes --> EquipmentCtrl[equipmentController.js\nInventory management]
    ActivityRoutes --> ActivityCtrl[activityController.js\nRecent activities]
    AuthRoutes --> AuthCtrl[authController.js\nLogin / auth logic]

    API --> Middleware[backend/middleware/authMiddleware.js]
    API --> DBConfig[backend/config/db.js\nMySQL connection pool]

    DBConfig --> Database[(MySQL Database)]

    MemberCtrl --> Database
    FinanceCtrl --> Database
    EquipmentCtrl --> Database
    ActivityCtrl --> Database
    AuthCtrl --> Database

    Database --> Tables[Members\nFinance\nEquipment\nActivities\nUsers]

    Frontend --> Scanner[QR Scanner Features\nhtml5-qrcode / jsqr]
    Scanner --> MemberCtrl

    classDef frontend fill:#e3f2fd,stroke:#1976d2,color:#0d47a1;
    classDef backend fill:#e8f5e9,stroke:#2e7d32,color:#1b5e20;
    classDef data fill:#fff3e0,stroke:#ef6c00,color:#e65100;
    classDef user fill:#f3e5f5,stroke:#8e24aa,color:#4a148c;

    class User,Browser,Frontend,App,Routes,AdminAuth,MemberAuth,Home,MemberPortal,UIComponents,MemberComponents,Scanner frontend;
    class API,CORS,RateLimit,RouteGroups,MemberRoutes,FinanceRoutes,EquipmentRoutes,ActivityRoutes,AuthRoutes,MemberCtrl,FinanceCtrl,EquipmentCtrl,ActivityCtrl,AuthCtrl,Middleware,DBConfig backend;
    class Database,Tables data;
```

## Project Summary

This project is a full-stack gym management system built with:

- Frontend: React + Vite + React Router
- Backend: Express.js API server
- Database: MySQL via mysql2 pool connection
- Features: member management, finance tracking, equipment management, activity logs, authentication, and QR check-in

## Main Entry Points

- Frontend app: `src/App.jsx`
- Router: `src/routes/AppRoutes.jsx`
- Backend server: `backend/index.js`
- Database config: `backend/config/db.js`
- API routes: `backend/routes/`
- Controllers: `backend/controllers/`
