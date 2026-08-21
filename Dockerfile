# ── Build stage ───────────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy project file and restore dependencies first (better layer caching)
COPY backend/ELMS.API/ELMS.API/ELMS.API.csproj ./
RUN dotnet restore

# Copy the rest of the source and publish
COPY backend/ELMS.API/ELMS.API/ ./
RUN dotnet publish -c Release -o /app/out

# ── Runtime stage ──────────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app

COPY --from=build /app/out ./

# Render.com requires the app to listen on port 10000
ENV ASPNETCORE_URLS=http://+:10000
EXPOSE 10000

ENTRYPOINT ["dotnet", "ELMS.API.dll"]
