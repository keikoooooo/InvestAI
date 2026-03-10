pppackage main

import (
	"context"
	"log"
	"net/http"
	"os"

	"diploma/backend/internal/api"
	"diploma/backend/internal/config"
	"diploma/backend/internal/market"
	"diploma/backend/internal/store"
)

func main() {
	// Optional: load env vars from backend/.env for local dev.
	_ = config.LoadDotenv(".env")

	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		log.Fatal("DATABASE_URL is required")
	}

	defaultUserEmail := os.Getenv("DEFAULT_USER_EMAIL")
	st, err := store.New(databaseURL, defaultUserEmail)
	if err != nil {
		log.Fatal(err)
	}
	defer st.Close()

	srv := api.NewServer(st)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("backend listening on :%s", port)

	// Background market data pollers (best-effort).
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	go market.StartBybitPoller(ctx, log.Default(), st)

	if err := http.ListenAndServe(":"+port, srv.Handler()); err != nil {
		log.Fatal(err)
	}
}
