package parser

import (
	"testing"

	"github.com/golang/geo/r3"
	"github.com/markus-wa/demoinfocs-golang/v5/pkg/demoinfocs/common"
)

// BenchmarkTranslatePosition tests the performance of position translation
func BenchmarkTranslatePosition(b *testing.B) {
	mapCS := MapDeMirage
	position := r3.Vector{X: 1000.0, Y: 2000.0, Z: 100.0}

	b.ReportAllocs()
	b.ResetTimer()

	for i := 0; i < b.N; i++ {
		_, _ = translatePosition(position, &mapCS)
	}
}

// BenchmarkConvertWeapon tests the performance of weapon conversion
func BenchmarkConvertWeapon(b *testing.B) {
	b.Run("Known Weapon", func(b *testing.B) {
		b.ReportAllocs()
		for i := 0; i < b.N; i++ {
			_ = convertWeapon(common.EqAK47)
		}
	})
}
