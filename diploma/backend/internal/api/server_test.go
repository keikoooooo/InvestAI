package api

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"diploma/backend/internal/store"
)

func TestHealth(t *testing.T) {
	srv := NewServer(&store.Store{})

	req := httptest.NewRequest(http.MethodGet, "/health", nil)
	w := httptest.NewRecorder()

	srv.Handler().ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d", http.StatusOK, w.Code)
	}
}
