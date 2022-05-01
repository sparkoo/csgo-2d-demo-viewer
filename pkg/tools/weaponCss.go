package main

import (
	"csgo-2d-demo-player/pkg/parser"
	"fmt"
	"log"
	"os"
)

func main() {
	uniqueGuns := make(map[string]bool)
	for _, v := range parser.WeaponsEqType {
		uniqueGuns[v] = true
	}

	if f, err := os.OpenFile("weapons.css_tmp", os.O_CREATE, 0644); err == nil {
		defer f.Close()

		_, writeWarningErr := f.WriteString("/* THIS FILE IS GENERATED, PLEASE DO NOT CHANGE !!! */\n\n")
		if writeWarningErr != nil {
			log.Fatalln(writeWarningErr)
		}
		for g, _ := range uniqueGuns {
			_, writeLineErr := f.WriteString(fmt.Sprintf(".%s {\n  background-image: url(\"assets/icons/csgo/%s.svg\");\n}\n\n", g, g))
			if writeLineErr != nil {
				log.Fatalln(writeLineErr)
			}
		}
		log.Printf("Generated styles for '%d' guns.", len(uniqueGuns))
	} else {
		log.Fatalln(err)
	}
}
