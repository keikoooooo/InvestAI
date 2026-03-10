package api

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"errors"
	"net/http"
	"time"

	"diploma/backend/internal/model"
	"diploma/backend/internal/store"
)

type Server struct {
	store *store.Store
	mux   *http.ServeMux
}

func NewServer(st *store.Store) *Server {
	s := &Server{store: st, mux: http.NewServeMux()}
	s.registerRoutes()
	return s
}

func (s *Server) Handler() http.Handler {
	return s.cors(s.mux)
}

func (s *Server) registerRoutes() {
	s.mux.HandleFunc("GET /health", s.handleHealth)

	s.mux.HandleFunc("POST /api/v1/auth/register", s.handleRegister)
	s.mux.HandleFunc("POST /api/v1/auth/login", s.handleLogin)

	s.mux.HandleFunc("GET /api/v1/onboarding", s.handleGetOnboarding)
	s.mux.HandleFunc("PUT /api/v1/onboarding", s.handlePutOnboarding)

	s.mux.HandleFunc("GET /api/v1/dashboard", s.handleDashboard)

	s.mux.HandleFunc("GET /api/v1/portfolio", s.handlePortfolio)
	s.mux.HandleFunc("GET /api/v1/portfolio/holdings", s.handlePortfolioHoldings)

	s.mux.HandleFunc("GET /api/v1/assets/{symbol}", s.handleAsset)

	s.mux.HandleFunc("GET /api/v1/ai/messages", s.handleAIMessages)
	s.mux.HandleFunc("POST /api/v1/ai/chat", s.handleAIChat)

	s.mux.HandleFunc("GET /api/v1/market/overview", s.handleMarketOverview)

	s.mux.HandleFunc("GET /api/v1/settings", s.handleSettingsGet)
	s.mux.HandleFunc("PUT /api/v1/settings", s.handleSettingsPut)
}

func reqContext(r *http.Request) (context.Context, context.CancelFunc) {
	return context.WithTimeout(r.Context(), 10*time.Second)
}

func (s *Server) userID(r *http.Request) (string, error) {
	ctx, cancel := reqContext(r)
	defer cancel()
	return s.store.ResolveUserID(ctx, r.Header.Get("X-User-ID"))
}

func (s *Server) handleHealth(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

type authRequest struct {
	Name     string `json:"name"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

func generateToken() string {
	buf := make([]byte, 24)
	if _, err := rand.Read(buf); err != nil {
		return "token"
	}
	return hex.EncodeToString(buf)
}

func (s *Server) handleRegister(w http.ResponseWriter, r *http.Request) {
	var req authRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid json")
		return
	}
	if req.Email == "" || req.Password == "" || req.Name == "" {
		writeError(w, http.StatusBadRequest, "name, email and password are required")
		return
	}
	ctx, cancel := reqContext(r)
	defer cancel()
	user, err := s.store.Register(ctx, req.Name, req.Email, req.Password)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	writeJSON(w, http.StatusCreated, map[string]interface{}{
		"token": generateToken(),
		"user":  user,
	})
}

func (s *Server) handleLogin(w http.ResponseWriter, r *http.Request) {
	var req authRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid json")
		return
	}
	if req.Email == "" || req.Password == "" {
		writeError(w, http.StatusBadRequest, "email and password are required")
		return
	}
	ctx, cancel := reqContext(r)
	defer cancel()
	user, err := s.store.Login(ctx, req.Email, req.Password)
	if err != nil {
		status := http.StatusUnauthorized
		if errors.Is(err, &store.StoreError{Code: store.ErrNotFound}) {
			status = http.StatusNotFound
		}
		writeError(w, status, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, map[string]interface{}{
		"token": generateToken(),
		"user":  user,
	})
}

func (s *Server) handleGetOnboarding(w http.ResponseWriter, r *http.Request) {
	userID, err := s.userID(r)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	ctx, cancel := reqContext(r)
	defer cancel()
	out, err := s.store.Onboarding(ctx, userID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, out)
}

func (s *Server) handlePutOnboarding(w http.ResponseWriter, r *http.Request) {
	var req model.Onboarding
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid json")
		return
	}
	userID, err := s.userID(r)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	ctx, cancel := reqContext(r)
	defer cancel()
	out, err := s.store.UpdateOnboarding(ctx, userID, req)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, out)
}

func (s *Server) handleDashboard(w http.ResponseWriter, r *http.Request) {
	userID, err := s.userID(r)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	ctx, cancel := reqContext(r)
	defer cancel()
	out, err := s.store.Dashboard(ctx, userID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, out)
}

func (s *Server) handlePortfolio(w http.ResponseWriter, r *http.Request) {
	userID, err := s.userID(r)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	ctx, cancel := reqContext(r)
	defer cancel()
	out, err := s.store.Portfolio(ctx, userID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, out)
}

func (s *Server) handlePortfolioHoldings(w http.ResponseWriter, r *http.Request) {
	userID, err := s.userID(r)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	search := r.URL.Query().Get("search")
	filterType := r.URL.Query().Get("type")
	ctx, cancel := reqContext(r)
	defer cancel()
	holdings, err := s.store.Holdings(ctx, userID, search, filterType)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, map[string]interface{}{"holdings": holdings})
}

func (s *Server) handleAsset(w http.ResponseWriter, r *http.Request) {
	userID, err := s.userID(r)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	symbol := r.PathValue("symbol")
	ctx, cancel := reqContext(r)
	defer cancel()
	asset, err := s.store.Asset(ctx, userID, symbol)
	if err != nil {
		if storeErr := new(store.StoreError); errors.As(err, &storeErr) && storeErr.Code == store.ErrNotFound {
			writeError(w, http.StatusNotFound, "asset not found")
			return
		}
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, asset)
}

func (s *Server) handleAIMessages(w http.ResponseWriter, r *http.Request) {
	userID, err := s.userID(r)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	ctx, cancel := reqContext(r)
	defer cancel()
	messages, err := s.store.AIHistory(ctx, userID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, map[string]interface{}{"messages": messages})
}

type aiChatRequest struct {
	Message string `json:"message"`
}

func (s *Server) handleAIChat(w http.ResponseWriter, r *http.Request) {
	var req aiChatRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid json")
		return
	}
	if req.Message == "" {
		writeError(w, http.StatusBadRequest, "message is required")
		return
	}
	userID, err := s.userID(r)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	ctx, cancel := reqContext(r)
	defer cancel()
	message, err := s.store.AskAI(ctx, userID, req.Message)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, message)
}

func (s *Server) handleMarketOverview(w http.ResponseWriter, r *http.Request) {
	userID, err := s.userID(r)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	ctx, cancel := reqContext(r)
	defer cancel()
	out, err := s.store.MarketOverview(ctx, userID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, out)
}

func (s *Server) handleSettingsGet(w http.ResponseWriter, r *http.Request) {
	userID, err := s.userID(r)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	ctx, cancel := reqContext(r)
	defer cancel()
	out, err := s.store.Settings(ctx, userID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, out)
}

func (s *Server) handleSettingsPut(w http.ResponseWriter, r *http.Request) {
	var req model.Settings
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid json")
		return
	}
	userID, err := s.userID(r)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	ctx, cancel := reqContext(r)
	defer cancel()
	out, err := s.store.UpdateSettings(ctx, userID, req)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, out)
}

func (s *Server) cors(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-User-ID")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func writeJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(data)
}

func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, map[string]string{"error": message})
}
