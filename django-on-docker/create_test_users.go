package main

import (
	"bytes"
	"crypto/tls"
	"encoding/json"
	"io"
	"log"
	"net/http"
)

type CreateUserRequest struct {
	DisplayName string `json:"display_name"`
	Email       string `json:"email"`
	Password    string `json:"password"`
}

type CreateUserResponse struct {
	DisplayName string `json:"display_name"`
	Email       string `json:"email"`
}

func main() {
	http.DefaultTransport.(*http.Transport).TLSClientConfig = &tls.Config{InsecureSkipVerify: true}

	testUsers := []CreateUserRequest{
		{
			DisplayName: "Eugene",
			Email:       "eugene@gmail.com",
			Password:    "1MoscowEcole",
		},
		{
			DisplayName: "Angelina",
			Email:       "angelina@gmail.com",
			Password:    "1MoscowEcole",
		},
		{
			DisplayName: "Sasha",
			Email:       "smaar@gmail.com",
			Password:    "1MoscowEcole",
		},
	}

	for _, testUser := range testUsers {
		data, err := json.Marshal(testUser)
		if err != nil {
			log.Fatalf("couldn't marshal user: %s", err)
		}

		resp, err := http.Post("https://localhost:8081/api/token/", "application/json", bytes.NewReader(data))
		if err != nil {
			log.Fatalf("couldn't create users: %s", err)
		}
		defer resp.Body.Close()

		respData, err := io.ReadAll(resp.Body)
		if err != nil {
			log.Fatalf("Couldn't read response body: %s", err)
		}

		var createdUser CreateUserResponse
		if err := json.Unmarshal(respData, &createdUser); err != nil {
			log.Fatalf("Couldn't unmarshal answer: %s", err)
		}

		log.Printf("Created user: %s %s\n", createdUser.DisplayName, createdUser.Email)
	}
}

type AdminLoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type AdminLoginResponse struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}
