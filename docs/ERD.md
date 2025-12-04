# Entity Relationship Diagram

```mermaid
erDiagram
    User ||--o{ Session : has
    User ||--o{ Project : owns
    User ||--o{ ProjectMember : member_of
    
    Project ||--o{ ProjectMember : has
    Project ||--o{ Event : receives
    Project ||--o{ AnalyticsSession : tracks
    Project ||--o{ PageView : aggregates
    Project ||--o{ Device : uses
    Project ||--o{ Referrer : has
    Project ||--o{ Geo : located_in
    
    AnalyticsSession ||--o| Device : uses
    AnalyticsSession ||--o| Referrer : from
    AnalyticsSession ||--o| Geo : in
    
    User {
        string id PK
        string email UK
        boolean emailVerified
        string name
        string image
        datetime createdAt
        datetime updatedAt
    }
    
    Session {
        string id PK
        string userId FK
        datetime expiresAt
        string token UK
        string ipAddress
        string userAgent
        datetime createdAt
        datetime updatedAt
    }
    
    Project {
        string id PK
        string userId FK
        string name
        string slug UK
        string description
        datetime createdAt
        datetime updatedAt
    }
    
    ProjectMember {
        string id PK
        string projectId FK
        string userId FK
        string role
        datetime createdAt
        datetime updatedAt
    }
    
    Event {
        string id PK
        string projectId FK
        string sessionId
        string type
        string url
        string path
        string referrer
        string title
        datetime timestamp
    }
    
    AnalyticsSession {
        string id PK
        string projectId FK
        string sessionId UK
        datetime startedAt
        datetime endedAt
        int duration
        int pageViews
        boolean isBounce
        string entryPage
        string exitPage
        string deviceId FK
        string referrerId FK
        string geoId FK
    }
    
    PageView {
        string id PK
        string projectId FK
        string path
        string title
        int views
        int uniqueViews
        datetime date
    }
    
    Device {
        string id PK
        string projectId FK
        string browser
        string browserVersion
        string os
        string osVersion
        string deviceType
        int screenWidth
        int screenHeight
        datetime createdAt
        datetime updatedAt
    }
    
    Referrer {
        string id PK
        string projectId FK
        string url
        string domain
        datetime createdAt
        datetime updatedAt
    }
    
    Geo {
        string id PK
        string projectId FK
        string country
        string city
        string region
        string timezone
        datetime createdAt
        datetime updatedAt
    }
```

## Relationships

- **User → Session**: One-to-many (user can have multiple sessions)
- **User → Project**: One-to-many (user can own multiple projects - unlimited!)
- **User → ProjectMember**: One-to-many (user can be a member of multiple projects)
- **Project → Event**: One-to-many (project receives many events)
- **Project → AnalyticsSession**: One-to-many (project tracks many sessions)
- **Project → Device**: One-to-many (project has many devices)
- **Project → Referrer**: One-to-many (project has many referrers)
- **Project → Geo**: One-to-many (project has visitors from many locations)
- **AnalyticsSession → Device**: Many-to-one (sessions use devices)
- **AnalyticsSession → Referrer**: Many-to-one (sessions come from referrers)
- **AnalyticsSession → Geo**: Many-to-one (sessions are from locations)

## Indexes

- `User.email` - Unique index
- `Session.token` - Unique index
- `Session.userId` - Index for user lookups
- `Project.slug` - Unique index
- `Project.userId` - Index for user's projects
- `ProjectMember.projectId_userId` - Composite unique index
- `Event.projectId_timestamp` - Composite index for time-based queries
- `Event.sessionId` - Index for session lookups
- `AnalyticsSession.sessionId` - Unique index
- `AnalyticsSession.projectId_startedAt` - Composite index for date range queries
- `PageView.projectId_path_date` - Composite unique index
- `Device.projectId_browser_os_deviceType_screenWidth_screenHeight` - Composite unique index
- `Referrer.projectId_domain` - Composite unique index
- `Geo.projectId_country_city` - Composite unique index

