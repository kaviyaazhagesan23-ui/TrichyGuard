# TrichyGuard

Accident risk assessment, zone classification, nearby hospital search, ambulance routing and weather monitoring for Tiruchirappalli.
Zones: Srirangam, Cantonment, Thillai Nagar, Rockfort, Ariyamangalam.

## Run

```bash
npm install
npm run dev        # development server
npm run build      # typecheck + production build
```

## Structure

```
src/pages        Dashboard, Accident Risk Prediction, Zone Classification, Risk Map,
                 Hospital Search, Ambulance Routing, Weather
src/components   Shared UI (sidebar, cards, maps, forms, charts)
src/data         Zones, hospitals, incidents, weather and dashboard data
src/services     api.ts (single place the UI calls), mock/ (local calculation engines)
src/hooks        useAsync, useCountUp, useDebounce, useMediaQuery
src/types        Shared TypeScript types
```

## Connecting the FastAPI backend

Copy `.env.example` to `.env`, set `VITE_USE_MOCK=false` and `VITE_API_BASE_URL`.
Every call the UI makes lives in `src/services/api.ts`; adjust the endpoint paths there and map responses to the types in `src/types`.
Zones live in `src/data/zones.ts` and hospitals in `src/data/hospitals.ts`; replace them with your own records.
