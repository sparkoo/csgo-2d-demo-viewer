package main

import (
	"net/http"
	"os"
	"path/filepath"
)

func downloadHandler(w http.ResponseWriter, r *http.Request) {
	// empty for now
}

func spaHandler(dir string) http.Handler {
	fs := http.FileServer(http.Dir(dir))
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		path := filepath.Join(dir, r.URL.Path)
		if _, err := os.Stat(path); os.IsNotExist(err) {
			http.ServeFile(w, r, filepath.Join(dir, "index.html"))
		} else {
			fs.ServeHTTP(w, r)
		}
	})
}

func main() {
	http.HandleFunc("/download", downloadHandler)
	http.Handle("/", spaHandler("../web/dist"))
	http.ListenAndServe(":8080", nil)
}
